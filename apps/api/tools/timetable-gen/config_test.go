package main

import "testing"

func TestLookupStation_Canonical(t *testing.T) {
	tests := []string{"八王子みなみ野駅", "八王子駅", "学生会館"}
	for _, name := range tests {
		r, err := lookupStation(name)
		if err != nil {
			t.Errorf("lookupStation(%q) error: %v", name, err)
		}
		if r.StationName != name {
			t.Errorf("lookupStation(%q).StationName = %q", name, r.StationName)
		}
	}
}

func TestLookupStation_Aliases(t *testing.T) {
	tests := []struct {
		input   string
		wantKey string
	}{
		{"八王子みなみ野", "minamino"},
		{"みなみ野駅", "minamino"},
		{"みなみ野", "minamino"},
		{"八王子駅南口", "hachioji"},
		{"八王子南口", "hachioji"},
		{"hachioji", "hachioji"},
		{"学生会館前", "gakuseikaikan"},
		{"gakuseikaikan", "gakuseikaikan"},
	}
	for _, tt := range tests {
		r, err := lookupStation(tt.input)
		if err != nil {
			t.Errorf("lookupStation(%q) error: %v", tt.input, err)
			continue
		}
		if r.Key != tt.wantKey {
			t.Errorf("lookupStation(%q).Key = %q, want %q", tt.input, r.Key, tt.wantKey)
		}
	}
}

func TestLookupStation_Unknown(t *testing.T) {
	_, err := lookupStation("存在しない駅")
	if err == nil {
		t.Error("expected error for unknown station, got nil")
	}
}

func TestScheduleLabel(t *testing.T) {
	tests := []struct {
		table ExtractedTable
		want  string
	}{
		{
			ExtractedTable{DayType: "weekday", ValidFrom: "2026-04-07"},
			"weekday-20260407",
		},
		{
			ExtractedTable{SpecificFrom: "2026-05-23", SpecificTo: "2026-05-23"},
			"2026-05-23",
		},
		{
			ExtractedTable{SpecificFrom: "2026-10-01", SpecificTo: "2026-10-02"},
			"2026-10-01_2026-10-02",
		},
	}
	for _, tt := range tests {
		got := scheduleLabel(tt.table)
		if got != tt.want {
			t.Errorf("scheduleLabel(%+v) = %q, want %q", tt.table, got, tt.want)
		}
	}
}
