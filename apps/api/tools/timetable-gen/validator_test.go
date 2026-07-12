package main

import (
	"strings"
	"testing"
)

func validService() ServiceData {
	return ServiceData{
		ID:        "hachioji-to-school-weekday-20260407",
		Direction: "inbound",
		From:      StopRef{StopID: 1, DisplayName: "八王子駅"},
		To:        StopRef{StopID: 3, DisplayName: "大学"},
		ValidityPeriods: []ValidityPeriod{
			{From: "2026-04-07", To: "2026-07-29"},
		},
		Segments: []ServiceSegment{
			{
				SegmentType: "fixed",
				Condition:   SegmentCondition{Type: "dayType", Value: "weekday"},
				Times: []TimePair{
					{Departure: "7:30", Arrival: "7:50"},
					{Departure: "8:00", Arrival: "8:20"},
					{Departure: "8:30", Arrival: "8:50"},
					{Departure: "9:00", Arrival: "9:20"},
					{Departure: "9:30", Arrival: "9:50"},
				},
			},
		},
	}
}

func TestValidate_Valid(t *testing.T) {
	errs := Validate(validService())
	if len(errs) != 0 {
		t.Errorf("expected no errors, got: %v", errs)
	}
}

func TestValidate_MissingID(t *testing.T) {
	svc := validService()
	svc.ID = ""
	assertContainsError(t, Validate(svc), "id is empty")
}

func TestValidate_InvalidDirection(t *testing.T) {
	svc := validService()
	svc.Direction = "unknown"
	assertContainsError(t, Validate(svc), "direction")
}

func TestValidate_EmptyValidityPeriods(t *testing.T) {
	svc := validService()
	svc.ValidityPeriods = nil
	assertContainsError(t, Validate(svc), "validityPeriods is empty")
}

func TestValidate_BadDateFormat(t *testing.T) {
	svc := validService()
	svc.ValidityPeriods = []ValidityPeriod{{From: "2026/04/07", To: "2026-07-29"}}
	assertContainsError(t, Validate(svc), "invalid date")
}

func TestValidate_FromAfterTo(t *testing.T) {
	svc := validService()
	svc.ValidityPeriods = []ValidityPeriod{{From: "2026-07-29", To: "2026-04-07"}}
	assertContainsError(t, Validate(svc), "is after")
}

func TestValidate_ImplausibleYear(t *testing.T) {
	svc := validService()
	svc.ValidityPeriods = []ValidityPeriod{{From: "2020-06-27", To: "2020-06-27"}}
	assertContainsError(t, Validate(svc), "year looks implausible")
}

func TestValidate_TooFewFixedTimes(t *testing.T) {
	svc := validService()
	svc.Segments[0].Times = []TimePair{
		{Departure: "7:30", Arrival: "7:50"},
	}
	assertContainsError(t, Validate(svc), "too few fixed times")
}

func TestValidate_DepartureAfterArrival(t *testing.T) {
	svc := validService()
	svc.Segments[0].Times[0] = TimePair{Departure: "8:00", Arrival: "7:30"}
	assertContainsError(t, Validate(svc), "departure")
}

func TestValidate_UnknownSegmentType(t *testing.T) {
	svc := validService()
	svc.Segments[0].SegmentType = "unknown"
	assertContainsError(t, Validate(svc), "unknown segmentType")
}

func TestValidate_ShuttleNoInterval(t *testing.T) {
	svc := validService()
	svc.Segments = append(svc.Segments, ServiceSegment{
		SegmentType: "shuttle",
		Condition:   SegmentCondition{Type: "dayType", Value: "weekday"},
		StartTime:   "9:00",
		EndTime:     "12:00",
		Interval:    nil,
	})
	assertContainsError(t, Validate(svc), "interval required")
}

func TestValidate_ShuttleIntervalZero(t *testing.T) {
	svc := validService()
	svc.Segments = append(svc.Segments, ServiceSegment{
		SegmentType: "shuttle",
		Condition:   SegmentCondition{Type: "dayType", Value: "weekday"},
		StartTime:   "9:00",
		EndTime:     "12:00",
		Interval:    &Interval{Min: 0, Max: 5},
	})
	assertContainsError(t, Validate(svc), "must be > 0")
}

func TestValidate_ShuttleIntervalMinGtMax(t *testing.T) {
	svc := validService()
	svc.Segments = append(svc.Segments, ServiceSegment{
		SegmentType: "shuttle",
		Condition:   SegmentCondition{Type: "dayType", Value: "weekday"},
		StartTime:   "9:00",
		EndTime:     "12:00",
		Interval:    &Interval{Min: 10, Max: 5},
	})
	assertContainsError(t, Validate(svc), "min(10) > max(5)")
}

func TestValidate_ShuttleStartAfterEnd(t *testing.T) {
	svc := validService()
	svc.Segments = append(svc.Segments, ServiceSegment{
		SegmentType: "shuttle",
		Condition:   SegmentCondition{Type: "dayType", Value: "weekday"},
		StartTime:   "12:00",
		EndTime:     "9:00",
		Interval:    &Interval{Min: 3, Max: 5},
	})
	assertContainsError(t, Validate(svc), "startTime")
}

func TestValidate_ShuttleMissingStartEnd(t *testing.T) {
	svc := validService()
	svc.Segments = append(svc.Segments, ServiceSegment{
		SegmentType: "shuttle",
		Condition:   SegmentCondition{Type: "dayType", Value: "weekday"},
		Interval:    &Interval{Min: 3, Max: 5},
	})
	assertContainsError(t, Validate(svc), "startTime/endTime required")
}

func assertContainsError(t *testing.T, errs []error, substr string) {
	t.Helper()
	for _, e := range errs {
		if strings.Contains(e.Error(), substr) {
			return
		}
	}
	t.Errorf("expected an error containing %q, got: %v", substr, errs)
}
