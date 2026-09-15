package main

import (
	"context"
	"testing"
	"time"
)

// Fixtures exercise the edge cases in docs/timetable-gen-geo-extractor-plan.md
// section 1.4: 260803.pdf (header alias "駅着発", 4-table layout, split
// validity declaration), 260727.pdf (merged 学生会館 header, narrow header
// gap), 260928.pdf (basic 5-table baseline). Expected values cross-checked
// against production Gemini output (verification report section 5.6).

type wantTable struct {
	stationName  string
	dayType      string
	specificFrom string
	specificTo   string
	validFrom    string
	validTo      string
	rowCount     int
	firstRow     [3]string
	lastRow      [3]string
}

func TestExtractGeo_Fixtures(t *testing.T) {
	cases := []struct {
		name string
		pdf  string
		want []wantTable
	}{
		{
			name: "260803 - 駅着発 alias, 4-table, specific-date Saturday section",
			pdf:  "testdata/260803.pdf",
			want: []wantTable{
				{stationName: "八王子みなみ野駅", dayType: "weekday", validFrom: "2026-08-03", validTo: "2026-08-28", rowCount: 52,
					firstRow: [3]string{"7:22", "7:29", "7:39"}, lastRow: [3]string{"21:20", "21:27", "21:37"}},
				{stationName: "八王子駅南口", dayType: "weekday", validFrom: "2026-08-03", validTo: "2026-08-28", rowCount: 52,
					firstRow: [3]string{"7:18", "7:30", "7:48"}, lastRow: [3]string{"21:20", "21:32", "21:45"}},
				{stationName: "八王子みなみ野駅", specificFrom: "2026-08-29", specificTo: "2026-08-29", rowCount: 11,
					firstRow: [3]string{"8:09", "8:16", "8:26"}, lastRow: [3]string{"17:41", "17:49", "18:01"}},
				{stationName: "八王子駅南口", specificFrom: "2026-08-29", specificTo: "2026-08-29", rowCount: 11,
					firstRow: [3]string{"7:47", "8:00", "8:18"}, lastRow: [3]string{"17:41", "17:54", "18:12"}},
			},
		},
		{
			name: "260727 - merged 学生会館 header word, narrow Saturday header gap",
			pdf:  "testdata/260727.pdf",
			want: []wantTable{
				{stationName: "八王子みなみ野駅", dayType: "weekday", validFrom: "2026-07-27", validTo: "2026-08-01", rowCount: 70,
					firstRow: [3]string{"7:22", "7:29", "7:39"}, lastRow: [3]string{"21:20", "21:27", "21:35"}},
				{stationName: "八王子駅南口", dayType: "weekday", validFrom: "2026-07-27", validTo: "2026-08-01", rowCount: 70,
					firstRow: [3]string{"7:18", "7:30", "7:48"}, lastRow: [3]string{"21:20", "21:31", "21:45"}},
				{stationName: "学生会館", dayType: "weekday", validFrom: "2026-07-27", validTo: "2026-08-01", rowCount: 7,
					firstRow: [3]string{"8:04", "8:14", "8:24"}, lastRow: [3]string{"17:00", "17:10", "17:20"}},
				{stationName: "八王子みなみ野駅", dayType: "saturday", validFrom: "2026-07-27", validTo: "2026-08-01", rowCount: 15,
					firstRow: [3]string{"8:08", "8:16", "8:28"}, lastRow: [3]string{"19:06", "19:14", "19:26"}},
				{stationName: "八王子駅南口", dayType: "saturday", validFrom: "2026-07-27", validTo: "2026-08-01", rowCount: 22,
					firstRow: [3]string{"7:47", "8:00", "8:18"}, lastRow: [3]string{"19:10", "19:23", "19:41"}},
			},
		},
		{
			name: "260928 - basic 5-table layout",
			pdf:  "testdata/260928.pdf",
			want: []wantTable{
				{stationName: "八王子みなみ野駅", dayType: "weekday", validFrom: "2026-09-28", validTo: "2026-12-21", rowCount: 84,
					firstRow: [3]string{"7:22", "7:29", "7:39"}, lastRow: [3]string{"21:20", "21:27", "21:37"}},
				{stationName: "八王子駅南口", dayType: "weekday", validFrom: "2026-09-28", validTo: "2026-12-21", rowCount: 84,
					firstRow: [3]string{"7:15", "7:30", "7:48"}, lastRow: [3]string{"21:20", "21:31", "21:45"}},
				{stationName: "学生会館", dayType: "weekday", validFrom: "2026-09-28", validTo: "2026-12-21", rowCount: 7,
					firstRow: [3]string{"8:04", "8:14", "8:24"}, lastRow: [3]string{"17:00", "17:10", "17:20"}},
				{stationName: "八王子みなみ野駅", dayType: "saturday", validFrom: "2026-09-28", validTo: "2026-12-21", rowCount: 15,
					firstRow: [3]string{"8:08", "8:16", "8:28"}, lastRow: [3]string{"19:06", "19:14", "19:26"}},
				{stationName: "八王子駅南口", dayType: "saturday", validFrom: "2026-09-28", validTo: "2026-12-21", rowCount: 22,
					firstRow: [3]string{"7:47", "8:00", "8:18"}, lastRow: [3]string{"19:10", "19:23", "19:41"}},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			extracted, err := ExtractGeo(context.Background(), tc.pdf)
			if err != nil {
				t.Fatalf("ExtractGeo(%q) error: %v", tc.pdf, err)
			}
			if len(extracted.Tables) != len(tc.want) {
				var got []string
				for _, tb := range extracted.Tables {
					got = append(got, tb.StationName+"/"+tb.DayType+tb.SpecificFrom)
				}
				t.Fatalf("got %d tables %v, want %d", len(extracted.Tables), got, len(tc.want))
			}

			for i, want := range tc.want {
				table := extracted.Tables[i]
				if table.StationName != want.stationName {
					t.Errorf("table[%d].StationName = %q, want %q", i, table.StationName, want.stationName)
				}
				if table.DayType != want.dayType {
					t.Errorf("table[%d].DayType = %q, want %q", i, table.DayType, want.dayType)
				}
				if table.SpecificFrom != want.specificFrom || table.SpecificTo != want.specificTo {
					t.Errorf("table[%d] specific = (%q,%q), want (%q,%q)", i, table.SpecificFrom, table.SpecificTo, want.specificFrom, want.specificTo)
				}
				if want.validFrom != "" && (table.ValidFrom != want.validFrom || table.ValidTo != want.validTo) {
					t.Errorf("table[%d] valid = (%q,%q), want (%q,%q)", i, table.ValidFrom, table.ValidTo, want.validFrom, want.validTo)
				}

				if len(table.Segments) != 1 || table.Segments[0].Type != "fixed" {
					t.Fatalf("table[%d]: expected exactly one fixed segment, got %+v", i, table.Segments)
				}
				rows := table.Segments[0].Rows
				if len(rows) != want.rowCount {
					t.Errorf("table[%d] (%s) row count = %d, want %d", i, want.stationName, len(rows), want.rowCount)
				}
				if len(rows) > 0 {
					if got := [3]string{rows[0][0], rows[0][1], rows[0][2]}; got != want.firstRow {
						t.Errorf("table[%d] first row = %v, want %v", i, got, want.firstRow)
					}
					last := rows[len(rows)-1]
					if got := [3]string{last[0], last[1], last[2]}; got != want.lastRow {
						t.Errorf("table[%d] last row = %v, want %v", i, got, want.lastRow)
					}
				}
			}

			// Every table must also survive Map()+Validate() end to end,
			// exactly like the Gemini path does.
			services, err := Map(extracted, nil)
			if err != nil {
				t.Fatalf("Map() error: %v", err)
			}
			if len(services) != len(tc.want)*2 {
				t.Errorf("Map() produced %d services, want %d (2 per table)", len(services), len(tc.want)*2)
			}
			for _, svc := range services {
				if errs := Validate(svc); len(errs) > 0 {
					t.Errorf("Validate(%s) errors: %v", svc.ID, errs)
				}
			}
		})
	}
}

// TestExtractGeo_NoAPIKeyRequired confirms the geo path works with no
// GEMINI_API_KEY set and a nil genai client - i.e. it goes through
// extractWithMode() exactly as main.go/sync.go call it for --extractor=geo,
// never touching the client or the key. See
// TestExtractWithMode_DurationOutlierDoesNotRejectValidPDF below for why
// this fixture's row_check warnings don't get in the way here.
func TestExtractGeo_NoAPIKeyRequired(t *testing.T) {
	t.Setenv("GEMINI_API_KEY", "")

	extracted, err := extractWithMode(context.Background(), nil, "testdata/260928.pdf", "geo")
	if err != nil {
		t.Fatalf("extractWithMode error: %v", err)
	}
	if len(extracted.Tables) != 5 {
		t.Errorf("got %d tables, want 5", len(extracted.Tables))
	}
}

// TestExtractWithMode_DurationOutlierDoesNotRejectValidPDF pins down the
// reason the duration check is a warning rather than an error. 260928.pdf's
// hachioji weekday table contains a real, production-confirmed 15min-vs-12min
// dep->mid outlier (the first bus of the day legitimately takes longer), and
// two more like it. A mode-based check cannot tell that apart from a
// corrupted row, so it must not reject the PDF: this fixture matches
// production data exactly and has to extract cleanly.
func TestExtractWithMode_DurationOutlierDoesNotRejectValidPDF(t *testing.T) {
	extracted, err := extractWithMode(context.Background(), nil, "testdata/260928.pdf", "geo")
	if err != nil {
		t.Fatalf("a valid PDF with legitimate duration outliers must still extract, got: %v", err)
	}
	if len(extracted.Tables) != 5 {
		t.Errorf("got %d tables, want 5", len(extracted.Tables))
	}

	// The outliers should still surface as warnings for a human reviewer.
	var warnings int
	for _, table := range extracted.Tables {
		for _, f := range CheckRows(table.StationName, table.Segments) {
			if f.Severity == SeverityWarning {
				warnings++
			}
		}
	}
	if warnings == 0 {
		t.Error("expected the duration outliers to be reported as warnings, got none")
	}
}

// TestExtractGeo_RowCheckFindingTriggersFallback confirms that when
// row_check.go flags a content-level anomaly, extractWithMode falls back to
// defaultFallback - which, since it's the unimplemented stub, means the
// call returns an error (not a panic, not silently-wrong data).
func TestExtractGeo_RowCheckFindingTriggersFallback(t *testing.T) {
	findings := CheckRows("test", []ExtractedSegment{
		{Type: "fixed", Rows: [][]string{
			{"7:00", "7:07", "7:17"},
			{"7:10", "7:17", "7:41"}, // mid->arr = 24min, not the dominant 10min
			{"7:20", "7:27", "7:37"},
			{"7:30", "7:37", "7:47"},
		}},
	})
	if len(findings) == 0 {
		t.Fatal("expected CheckRows to flag the corrupted row, got no findings")
	}

	if _, err := defaultFallback.Extract("dummy.pdf", "row_check finding"); err == nil {
		t.Error("expected the stub FallbackExtractor to return an error")
	}
}

// An expired context must fail fast, not run the subprocess to completion.
func TestExtractGeo_RespectsContextDeadline(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Nanosecond)
	defer cancel()
	time.Sleep(time.Millisecond) // make sure the deadline has actually passed

	start := time.Now()
	_, err := ExtractGeo(ctx, "testdata/260928.pdf")
	elapsed := time.Since(start)

	if err == nil {
		t.Fatal("expected an error from an already-expired context, got nil")
	}
	if elapsed > 5*time.Second {
		t.Errorf("ExtractGeo took %v to fail on an expired context - it isn't actually bounded by ctx", elapsed)
	}
}

// 260912.pdf has no "YYYY年度" text, so the year must come from the
// filename ("260912.pdf" -> 2026) - see geo_extract.py's _year_from_filename.
func TestExtractGeo_YearFallsBackToFilename(t *testing.T) {
	extracted, err := ExtractGeo(context.Background(), "testdata/260912.pdf")
	if err != nil {
		t.Fatalf("ExtractGeo error: %v", err)
	}
	if len(extracted.Tables) != 2 {
		t.Fatalf("got %d tables, want 2", len(extracted.Tables))
	}
	for _, table := range extracted.Tables {
		if table.SpecificFrom != "2026-09-12" || table.SpecificTo != "2026-09-12" {
			t.Errorf("table %q: specificFrom/To = (%q,%q), want (2026-09-12, 2026-09-12) - filename year fallback did not apply",
				table.StationName, table.SpecificFrom, table.SpecificTo)
		}
	}

	services, err := Map(extracted, nil)
	if err != nil {
		t.Fatalf("Map() error: %v", err)
	}
	for _, svc := range services {
		if errs := Validate(svc); len(errs) > 0 {
			t.Errorf("Validate(%s) errors: %v", svc.ID, errs)
		}
	}
}

// 260927.pdf's shuttle section states no numeric interval, only
// "(乗車状況により運行)" - must produce a Note instead, not fail Validate().
func TestExtractGeo_ShuttleWithoutNumericInterval(t *testing.T) {
	extracted, err := ExtractGeo(context.Background(), "testdata/260927.pdf")
	if err != nil {
		t.Fatalf("ExtractGeo error: %v", err)
	}

	services, err := Map(extracted, nil)
	if err != nil {
		t.Fatalf("Map() error: %v", err)
	}
	if len(services) == 0 {
		t.Fatal("Map() produced no services")
	}

	var sawShuttleWithoutInterval bool
	for _, svc := range services {
		if errs := Validate(svc); len(errs) > 0 {
			t.Errorf("Validate(%s) errors: %v", svc.ID, errs)
		}
		for _, seg := range svc.Segments {
			if seg.SegmentType != "shuttle" {
				continue
			}
			if seg.Interval == nil {
				sawShuttleWithoutInterval = true
				if seg.Note == "" {
					t.Errorf("%s: shuttle segment has neither Interval nor Note", svc.ID)
				}
			}
		}
	}
	if !sawShuttleWithoutInterval {
		t.Error("expected at least one shuttle segment with no numeric interval in this fixture - did the fixture or parsing change?")
	}
}
