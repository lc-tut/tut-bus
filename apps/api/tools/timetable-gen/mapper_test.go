package main

import (
	"testing"
)

func TestNormalizeTime(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"7:30", "7:30"},
		{"07:30", "7:30"},
		{"14:05", "14:05"},
		{"0:00", "0:00"},
		{"23:59", "23:59"},
		// edge: leading/trailing space
		{" 8:00 ", "8:00"},
		// empty / dash variants → ""
		{"", ""},
		{"-", ""},
		{"ー", ""},
		// malformed
		{"730", ""},
		{"7:3", ""},
		{"7:300", ""},
		{"abc", ""},
	}
	for _, tt := range tests {
		got := normalizeTime(tt.input)
		if got != tt.want {
			t.Errorf("normalizeTime(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestParseInterval(t *testing.T) {
	tests := []struct {
		input    string
		wantMin  int
		wantMax  int
	}{
		{"約3〜5分間隔", 3, 5},
		{"約3~5分間隔", 3, 5},
		{"約3～5分間隔", 3, 5},
		{"約5分間隔", 5, 5},
		{"約10分間隔", 10, 10},
		// no match
		{"シャトル運行", 0, 0},
		{"", 0, 0},
	}
	for _, tt := range tests {
		gotMin, gotMax := parseInterval(tt.input)
		if gotMin != tt.wantMin || gotMax != tt.wantMax {
			t.Errorf("parseInterval(%q) = (%d, %d), want (%d, %d)", tt.input, gotMin, gotMax, tt.wantMin, tt.wantMax)
		}
	}
}

func TestIsShuttleRow(t *testing.T) {
	tests := []struct {
		row  []string
		want bool
	}{
		{[]string{"～", "～", "～", "約3〜5分間隔"}, true},
		{[]string{"〜", "〜", "〜"}, true},
		{[]string{"~", "~", "~"}, true},
		// only one tilde → not shuttle
		{[]string{"～", "7:30", "7:40"}, false},
		{[]string{"7:30", "7:35", "7:40"}, false},
		{[]string{}, false},
	}
	for _, tt := range tests {
		got := isShuttleRow(tt.row)
		if got != tt.want {
			t.Errorf("isShuttleRow(%v) = %v, want %v", tt.row, got, tt.want)
		}
	}
}

func TestExpandShuttleRows(t *testing.T) {
	segs := []ExtractedSegment{
		{
			Type: "fixed",
			Rows: [][]string{
				{"7:30", "7:35", "7:40"},
				{"8:00", "8:05", "8:10"},
				{"～", "～", "～", "約3〜5分間隔"},
				{"12:00", "12:05", "12:10"},
			},
		},
	}

	got := expandShuttleRows(segs, 0)

	if len(got) != 3 {
		t.Fatalf("expected 3 segments, got %d", len(got))
	}
	if got[0].Type != "fixed" || len(got[0].Rows) != 2 {
		t.Errorf("first segment: want fixed with 2 rows, got type=%q rows=%d", got[0].Type, len(got[0].Rows))
	}
	if got[1].Type != "shuttle" {
		t.Errorf("second segment: want shuttle, got %q", got[1].Type)
	}
	if got[1].IntervalMin != 3 || got[1].IntervalMax != 5 {
		t.Errorf("shuttle interval: want (3, 5), got (%d, %d)", got[1].IntervalMin, got[1].IntervalMax)
	}
	if got[2].Type != "fixed" || len(got[2].Rows) != 1 {
		t.Errorf("third segment: want fixed with 1 row, got type=%q rows=%d", got[2].Type, len(got[2].Rows))
	}
}

func TestLastAndFirstDepTime(t *testing.T) {
	segs := []ExtractedSegment{
		{Type: "fixed", Rows: [][]string{
			{"7:30", "7:35", "7:40"},
			{"8:00", "8:05", "8:10"},
		}},
		{Type: "shuttle"},
		{Type: "fixed", Rows: [][]string{
			{"12:00", "12:05", "12:10"},
			{"13:00", "13:05", "13:10"},
		}},
	}

	// shuttle is at index 1; depCol = 0
	if got := lastDepTime(segs, 1, 0); got != "8:00" {
		t.Errorf("lastDepTime = %q, want %q", got, "8:00")
	}
	if got := firstDepTime(segs, 1, 0); got != "12:00" {
		t.Errorf("firstDepTime = %q, want %q", got, "12:00")
	}
}

func TestBuildSegments_ShuttleTimeFilled(t *testing.T) {
	segs := []ExtractedSegment{
		{
			Type: "fixed",
			Rows: [][]string{
				{"7:30", "7:35", "7:40"},
				{"8:00", "8:05", "8:10"},
				{"～", "～", "～", "約5分間隔"},
				{"12:00", "12:05", "12:10"},
			},
		},
	}
	cond := SegmentCondition{Type: "dayType", Value: "weekday"}
	result := buildSegments(segs, cond, 0, 1)

	// expect: fixed(2 rows), shuttle, fixed(1 row)
	if len(result) != 3 {
		t.Fatalf("expected 3 service segments, got %d", len(result))
	}
	shuttle := result[1]
	if shuttle.SegmentType != "shuttle" {
		t.Errorf("segment[1] type = %q, want shuttle", shuttle.SegmentType)
	}
	if shuttle.StartTime != "8:00" {
		t.Errorf("shuttle.StartTime = %q, want 8:00", shuttle.StartTime)
	}
	if shuttle.EndTime != "12:00" {
		t.Errorf("shuttle.EndTime = %q, want 12:00", shuttle.EndTime)
	}
	if shuttle.Interval == nil || shuttle.Interval.Min != 5 || shuttle.Interval.Max != 5 {
		t.Errorf("shuttle.Interval = %v, want {Min:5, Max:5}", shuttle.Interval)
	}
}

func TestBuildSegments_ColumnAssignment(t *testing.T) {
	// col0=campus-dep, col1=station, col2=campus-arr
	rows := [][]string{
		{"7:30", "7:35", "7:40"},
	}
	segs := []ExtractedSegment{{Type: "fixed", Rows: rows}}
	cond := SegmentCondition{Type: "dayType", Value: "weekday"}

	outbound := buildSegments(segs, cond, 0, 1) // dep=col0, arr=col1
	if len(outbound) != 1 || len(outbound[0].Times) != 1 {
		t.Fatal("unexpected outbound segment")
	}
	if outbound[0].Times[0].Departure != "7:30" || outbound[0].Times[0].Arrival != "7:35" {
		t.Errorf("outbound times: dep=%q arr=%q, want 7:30 7:35", outbound[0].Times[0].Departure, outbound[0].Times[0].Arrival)
	}

	inbound := buildSegments(segs, cond, 1, 2) // dep=col1, arr=col2
	if len(inbound) != 1 || len(inbound[0].Times) != 1 {
		t.Fatal("unexpected inbound segment")
	}
	if inbound[0].Times[0].Departure != "7:35" || inbound[0].Times[0].Arrival != "7:40" {
		t.Errorf("inbound times: dep=%q arr=%q, want 7:35 7:40", inbound[0].Times[0].Departure, inbound[0].Times[0].Arrival)
	}
}
