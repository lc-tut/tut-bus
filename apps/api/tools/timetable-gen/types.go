package main

// --- Intermediate format (extracted from Gemini) ---

type ExtractedData struct {
	Tables []ExtractedTable `json:"tables"`
}

type ExtractedTable struct {
	StationName  string             `json:"stationName"`
	DayType      string             `json:"dayType,omitempty"`      // "weekday"|"saturday"|"holiday"
	SpecificFrom string             `json:"specificFrom,omitempty"` // YYYY-MM-DD for specific-date schedules
	SpecificTo   string             `json:"specificTo,omitempty"`
	ValidFrom    string             `json:"validFrom,omitempty"`
	ValidTo      string             `json:"validTo,omitempty"`
	Segments     []ExtractedSegment `json:"segments"`
}

// ExtractedSegment represents either a fixed (individual times) or shuttle (range) segment.
// For fixed: Rows contains [col1, col2, col3] = [大学発, 駅着/駅発, 大学着]
// For shuttle: StartTime/EndTime/IntervalMin/IntervalMax are set
type ExtractedSegment struct {
	Type        string     `json:"type"` // "fixed" | "shuttle"
	Rows        [][]string `json:"rows,omitempty"`
	StartTime   string     `json:"startTime,omitempty"`
	EndTime     string     `json:"endTime,omitempty"`
	IntervalMin int        `json:"intervalMin,omitempty"`
	IntervalMax int        `json:"intervalMax,omitempty"`
	Note        string     `json:"note,omitempty"`
}

// --- Output format (ServiceData) ---

type ServiceData struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	From            StopRef          `json:"from"`
	To              StopRef          `json:"to"`
	Direction       string           `json:"direction"`
	ValidityPeriods []ValidityPeriod `json:"validityPeriods"`
	Segments        []ServiceSegment `json:"segments"`
}

type StopRef struct {
	StopID      int    `json:"stopId"`
	DisplayName string `json:"displayName"`
}

type ValidityPeriod struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type ServiceSegment struct {
	SegmentType string           `json:"segmentType"`
	Condition   SegmentCondition `json:"condition"`
	Times       []TimePair       `json:"times,omitempty"`
	StartTime   string           `json:"startTime,omitempty"`
	EndTime     string           `json:"endTime,omitempty"`
	Interval    *Interval        `json:"intervalRange,omitempty"`
	Note        string           `json:"note,omitempty"`
}

type SegmentCondition struct {
	Type  string `json:"type"`            // "dayType" | "specificPeriod"
	Value string `json:"value,omitempty"` // for dayType: "weekday"|"saturday"|"holiday"
	From  string `json:"from,omitempty"`  // for specificPeriod: YYYY-MM-DD
	To    string `json:"to,omitempty"`    // for specificPeriod: YYYY-MM-DD
}

type TimePair struct {
	Departure string `json:"departure"`
	Arrival   string `json:"arrival"`
}

type Interval struct {
	Min int `json:"min"`
	Max int `json:"max"`
}
