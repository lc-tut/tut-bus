package main

import (
	"fmt"
	"strconv"
	"strings"
)

// RowFinding is one row-level integrity issue found by CheckRows.
type RowFinding struct {
	Index    int // index into the segment's original Rows slice
	Message  string
	Severity Severity
}

// Severity separates findings that should stop a PDF from being written
// (SeverityError) from ones that are only worth logging (SeverityWarning).
// Only errors trigger the LLM fallback.
type Severity int

const (
	SeverityWarning Severity = iota
	SeverityError
)

func (s Severity) String() string {
	if s == SeverityError {
		return "ERROR"
	}
	return "WARN"
}

// HasError reports whether any finding is severe enough to reject the table.
func HasError(findings []RowFinding) bool {
	for _, f := range findings {
		if f.Severity == SeverityError {
			return true
		}
	}
	return false
}

// CheckRows goes beyond Validate() (format + departure<arrival + minimum
// count) to catch fabricated/duplicated/out-of-order rows. See
// docs/ocr-extraction-verification-report.md section 8.
//
// Column-to-column duration consistency (dep->mid, mid->arr) is a WARNING
// only, never an error: legitimate schedules deviate by up to 3min (first/
// last bus of the day, bimodal tables), while the one real fabricated row
// found deviated by 4min - too tight a margin to reject a PDF on. Wired as
// an error it rejected every PDF tested, every flagged row being real.
//
// Deliberately not implemented: departure-to-departure gap statistics
// (false-positived on legitimate gaps, false-negatived the one fabricated
// row - see report section 8.1).
//
// Known limitation: cannot detect a dropped row (nothing malformed is left
// to flag). Not a realistic failure mode for ExtractGeo, which reads PDF
// text 1:1; matters only for LLM-fallback output, accepted pending a human
// pre-publish check.
func CheckRows(label string, segments []ExtractedSegment) []RowFinding {
	var findings []RowFinding
	for _, seg := range splitOnShuttleRows(flattenFixedRows(segments)) {
		findings = append(findings, checkMonotonic(label, seg)...)
		findings = append(findings, checkDuplicateRows(label, seg)...)
		findings = append(findings, checkColumnDurations(label, seg)...)
	}
	return findings
}

// flattenFixedRows concatenates the Rows of every "fixed" segment, in order.
func flattenFixedRows(segments []ExtractedSegment) [][]string {
	var rows [][]string
	for _, seg := range segments {
		if seg.Type != "fixed" {
			continue
		}
		rows = append(rows, seg.Rows...)
	}
	return rows
}

type indexedRow struct {
	index int
	row   []string
}

// splitOnShuttleRows splits rows at "～"/"~" separator rows so checks only
// compare rows within the same sub-segment (a shuttle break is a genuine
// discontinuity, not an error).
func splitOnShuttleRows(rows [][]string) [][]indexedRow {
	var segments [][]indexedRow
	var cur []indexedRow
	for i, r := range rows {
		if isTildeRow(r) {
			if len(cur) > 0 {
				segments = append(segments, cur)
				cur = nil
			}
			continue
		}
		cur = append(cur, indexedRow{index: i, row: r})
	}
	if len(cur) > 0 {
		segments = append(segments, cur)
	}
	return segments
}

func isTildeRow(row []string) bool {
	return len(row) > 0 && (row[0] == "～" || row[0] == "〜" || row[0] == "~")
}

func checkMonotonic(label string, seg []indexedRow) []RowFinding {
	var findings []RowFinding
	for i := 1; i < len(seg); i++ {
		prevMin, err1 := rowColumnMinutes(seg[i-1].row, 0)
		curMin, err2 := rowColumnMinutes(seg[i].row, 0)
		if err1 != nil || err2 != nil {
			continue
		}
		if curMin < prevMin {
			findings = append(findings, RowFinding{
				Index: seg[i].index,
				Message: fmt.Sprintf("[%s] row %d departure %s is earlier than previous row %d (%s) - out of order",
					label, seg[i].index, seg[i].row[0], seg[i-1].index, seg[i-1].row[0]),
				Severity: SeverityError,
			})
		}
	}
	return findings
}

func checkDuplicateRows(label string, seg []indexedRow) []RowFinding {
	var findings []RowFinding
	seen := map[string]int{}
	for _, ir := range seg {
		key := strings.Join(firstN(ir.row, 3), "|")
		if prevIdx, ok := seen[key]; ok {
			findings = append(findings, RowFinding{
				Index:    ir.index,
				Message:  fmt.Sprintf("[%s] row %d %v duplicates row %d exactly", label, ir.index, ir.row, prevIdx),
				Severity: SeverityError,
			})
			continue
		}
		seen[key] = ir.index
	}
	return findings
}

type durationLeg struct {
	colA, colB int
	name       string
}

var durationLegs = []durationLeg{
	{colA: 0, colB: 1, name: "dep->mid"},
	{colA: 1, colB: 2, name: "mid->arr"},
}

func checkColumnDurations(label string, seg []indexedRow) []RowFinding {
	var findings []RowFinding
	for _, leg := range durationLegs {
		type durRow struct {
			index int
			row   []string
			dur   int
		}
		var durs []durRow
		for _, ir := range seg {
			if len(ir.row) <= leg.colB {
				continue
			}
			ta, errA := parseHHMM(ir.row[leg.colA])
			tb, errB := parseHHMM(ir.row[leg.colB])
			if errA != nil || errB != nil {
				continue
			}
			durs = append(durs, durRow{index: ir.index, row: ir.row, dur: tb - ta})
		}
		if len(durs) < 3 {
			continue // too few rows to judge a dominant duration
		}

		counts := map[int]int{}
		for _, d := range durs {
			counts[d.dur]++
		}
		maxCount := 0
		for _, c := range counts {
			if c > maxCount {
				maxCount = c
			}
		}
		// Deterministic tie-break: first duration (in row order) that
		// reaches maxCount, mirroring Python Counter.most_common's
		// insertion-order tie-break.
		modeDur := durs[0].dur
		for _, d := range durs {
			if counts[d.dur] == maxCount {
				modeDur = d.dur
				break
			}
		}
		if float64(maxCount)/float64(len(durs)) < 0.6 {
			continue // no dominant duration in this segment - too noisy to judge
		}

		for _, d := range durs {
			if d.dur != modeDur {
				findings = append(findings, RowFinding{
					Index: d.index,
					Message: fmt.Sprintf("[%s] row %d %v: %s duration is %dmin where most of this table is %dmin (%d/%d rows) - worth a human look, but legitimate schedules do vary by a few minutes",
						label, d.index, d.row, leg.name, d.dur, modeDur, maxCount, len(durs)),
					Severity: SeverityWarning,
				})
			}
		}
	}
	return findings
}

func rowColumnMinutes(row []string, col int) (int, error) {
	if col >= len(row) {
		return 0, fmt.Errorf("row too short")
	}
	return parseHHMM(row[col])
}

func parseHHMM(s string) (int, error) {
	parts := strings.SplitN(strings.TrimSpace(s), ":", 2)
	if len(parts) != 2 {
		return 0, fmt.Errorf("invalid time %q", s)
	}
	h, err := strconv.Atoi(strings.TrimSpace(parts[0]))
	if err != nil {
		return 0, fmt.Errorf("invalid hour in %q: %w", s, err)
	}
	m, err := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err != nil {
		return 0, fmt.Errorf("invalid minute in %q: %w", s, err)
	}
	return h*60 + m, nil
}

func firstN(s []string, n int) []string {
	if len(s) < n {
		return s
	}
	return s[:n]
}
