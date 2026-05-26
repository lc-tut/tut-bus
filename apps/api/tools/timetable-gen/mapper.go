package main

import (
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
)

// Map converts extracted PDF data into ServiceData pairs (outbound + inbound per table).
// Column assignment is deterministic and never delegated to AI:
//
//	outbound (大学→駅): departure=col[0], arrival=col[1]
//	inbound  (駅→大学): departure=col[1], arrival=col[2]
func Map(data *ExtractedData, periods []ValidityPeriod) ([]ServiceData, error) {
	var services []ServiceData

	for _, table := range data.Tables {
		route, err := lookupStation(table.StationName)
		if err != nil {
			return nil, fmt.Errorf("table %q: %w", table.StationName, err)
		}

		vp := resolvePeriods(table, periods)
		cond := buildCondition(table)

		outbound := ServiceData{
			ID:              outboundServiceID(route, table),
			Name:            outboundServiceName(route, table),
			From:            StopRef{StopID: route.SchoolStopID, DisplayName: route.SchoolName},
			To:              StopRef{StopID: route.StationStopID, DisplayName: route.StationName},
			Direction:       "outbound",
			ValidityPeriods: vp,
			Segments:        buildSegments(table.Segments, cond, 0, 1),
		}

		inbound := ServiceData{
			ID:              inboundServiceID(route, table),
			Name:            inboundServiceName(route, table),
			From:            StopRef{StopID: route.StationStopID, DisplayName: route.StationName},
			To:              StopRef{StopID: route.SchoolStopID, DisplayName: route.SchoolName},
			Direction:       "inbound",
			ValidityPeriods: vp,
			Segments:        buildSegments(table.Segments, cond, 1, 2),
		}

		services = append(services, outbound, inbound)
	}

	return services, nil
}

// buildSegments maps extracted segments to ServiceSegments using the given column indices.
// Fixed segments are split at "～" rows into (fixed, shuttle, fixed, ...) sequences.
// Shuttle segments missing startTime/endTime are filled in from adjacent fixed rows.
func buildSegments(segs []ExtractedSegment, cond SegmentCondition, depCol, arrCol int) []ServiceSegment {
	// First, expand fixed segments that contain embedded "～" rows into shuttle splits.
	expanded := expandShuttleRows(segs, depCol)

	var result []ServiceSegment
	for i, seg := range expanded {
		if seg.Type == "shuttle" && (seg.StartTime == "" || seg.EndTime == "") {
			seg.StartTime = lastDepTime(expanded, i, depCol)
			seg.EndTime = firstDepTime(expanded, i, depCol)
			if seg.StartTime == "" || seg.EndTime == "" {
				log.Printf("警告: shuttle の前後から startTime/endTime を補完できませんでした。スキップします")
				continue
			}
			log.Printf("shuttle startTime/endTime を補完: %s 〜 %s", seg.StartTime, seg.EndTime)
		}
		result = append(result, toServiceSegment(seg, cond, depCol, arrCol))
	}
	return result
}

// shuttleNoteCol is the column index where Gemini puts the interval note for "～" rows.
const shuttleNoteCol = 3

// expandShuttleRows splits fixed segments at "～" rows, emitting shuttle placeholders.
func expandShuttleRows(segs []ExtractedSegment, depCol int) []ExtractedSegment {
	var result []ExtractedSegment
	for _, seg := range segs {
		if seg.Type != "fixed" {
			result = append(result, seg)
			continue
		}

		var currentRows [][]string
		for _, row := range seg.Rows {
			if isShuttleRow(row) {
				if len(currentRows) > 0 {
					result = append(result, ExtractedSegment{Type: "fixed", Rows: currentRows})
					currentRows = nil
				}
				// shuttle placeholder — startTime/endTime will be filled by surrounding rows
				intervalMin, intervalMax := parseInterval(rowCol(row, shuttleNoteCol))
				result = append(result, ExtractedSegment{
					Type:        "shuttle",
					IntervalMin: intervalMin,
					IntervalMax: intervalMax,
				})
			} else {
				currentRows = append(currentRows, row)
			}
		}
		if len(currentRows) > 0 {
			result = append(result, ExtractedSegment{Type: "fixed", Rows: currentRows})
		}
	}
	return result
}

// isShuttleRow returns true if a row is a shuttle delimiter (contains "～" or "〜" in time cells).
func isShuttleRow(row []string) bool {
	shuttleChars := 0
	for _, cell := range row {
		s := strings.TrimSpace(cell)
		if s == "～" || s == "〜" || s == "~" {
			shuttleChars++
		}
	}
	return shuttleChars >= 2
}

// lastDepTime returns the departure time of the last valid row in the nearest fixed segment before index i.
func lastDepTime(segs []ExtractedSegment, i, depCol int) string {
	for j := i - 1; j >= 0; j-- {
		if segs[j].Type != "fixed" {
			continue
		}
		for k := len(segs[j].Rows) - 1; k >= 0; k-- {
			if t := normalizeTime(rowCol(segs[j].Rows[k], depCol)); t != "" {
				return t
			}
		}
	}
	return ""
}

// firstDepTime returns the departure time of the first valid row in the nearest fixed segment after index i.
func firstDepTime(segs []ExtractedSegment, i, depCol int) string {
	for j := i + 1; j < len(segs); j++ {
		if segs[j].Type != "fixed" {
			continue
		}
		for _, row := range segs[j].Rows {
			if t := normalizeTime(rowCol(row, depCol)); t != "" {
				return t
			}
		}
	}
	return ""
}

// parseInterval extracts min/max from strings like "約3〜5分間隔" or "約5分間隔".
var reInterval = regexp.MustCompile(`(\d+)[〜~～](\d+)分|約(\d+)分`)

func parseInterval(s string) (min, max int) {
	m := reInterval.FindStringSubmatch(s)
	if m == nil {
		return 0, 0
	}
	if m[1] != "" && m[2] != "" {
		min, _ = strconv.Atoi(m[1])
		max, _ = strconv.Atoi(m[2])
		return min, max
	}
	if m[3] != "" {
		v, _ := strconv.Atoi(m[3])
		return v, v
	}
	return 0, 0
}

func rowCol(row []string, col int) string {
	if col < len(row) {
		return row[col]
	}
	return ""
}

func toServiceSegment(seg ExtractedSegment, cond SegmentCondition, depCol, arrCol int) ServiceSegment {
	if seg.Type == "shuttle" {
		s := ServiceSegment{
			SegmentType: "shuttle",
			Condition:   cond,
			StartTime:   seg.StartTime,
			EndTime:     seg.EndTime,
		}
		if seg.IntervalMin > 0 || seg.IntervalMax > 0 {
			s.Interval = &Interval{Min: seg.IntervalMin, Max: seg.IntervalMax}
		}
		if seg.Note != "" {
			s.Note = seg.Note
		}
		return s
	}

	// fixed: extract the relevant two columns from each row
	var times []TimePair
	for _, row := range seg.Rows {
		if len(row) <= arrCol {
			continue
		}
		dep := normalizeTime(row[depCol])
		arr := normalizeTime(row[arrCol])
		if dep == "" || arr == "" {
			continue
		}
		times = append(times, TimePair{Departure: dep, Arrival: arr})
	}

	return ServiceSegment{
		SegmentType: "fixed",
		Condition:   cond,
		Times:       times,
	}
}

func buildCondition(table ExtractedTable) SegmentCondition {
	if table.SpecificFrom != "" {
		to := table.SpecificTo
		if to == "" {
			to = table.SpecificFrom
		}
		return SegmentCondition{Type: "specificPeriod", From: table.SpecificFrom, To: to}
	}
	return SegmentCondition{Type: "dayType", Value: table.DayType}
}

// normalizeTime converts a time string to "H:MM" (no leading zero on hour).
// Returns "" for empty or unparseable input.
func normalizeTime(s string) string {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" || s == "ー" {
		return ""
	}
	parts := strings.SplitN(s, ":", 2)
	if len(parts) != 2 {
		return ""
	}
	hour := strings.TrimLeft(strings.TrimSpace(parts[0]), "0")
	if hour == "" {
		hour = "0"
	}
	min := strings.TrimSpace(parts[1])
	if len(min) != 2 {
		return ""
	}
	return hour + ":" + min
}

// resolvePeriods returns CLI-provided periods, then PDF-extracted periods, then a safe default.
func resolvePeriods(table ExtractedTable, cli []ValidityPeriod) []ValidityPeriod {
	if len(cli) > 0 {
		return cli
	}
	if table.SpecificFrom != "" {
		to := table.SpecificTo
		if to == "" {
			to = table.SpecificFrom
		}
		return []ValidityPeriod{{From: table.SpecificFrom, To: to}}
	}
	if table.ValidFrom != "" && table.ValidTo != "" {
		return []ValidityPeriod{{From: table.ValidFrom, To: table.ValidTo}}
	}
	return []ValidityPeriod{{From: "2025-04-01", To: "2099-12-31"}}
}
