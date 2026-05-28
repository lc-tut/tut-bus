package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// minFixedTimesPerService is the minimum number of fixed-segment times required for a service
// to be considered complete. Catches cases where Gemini missed most of the table.
const minFixedTimesPerService = 5

// Validate checks a ServiceData for correctness and completeness.
// Returns a slice of errors; empty means valid.
func Validate(svc ServiceData) []error {
	var errs []error

	if svc.ID == "" {
		errs = append(errs, fmt.Errorf("id is empty"))
	}
	if svc.From.StopID == 0 {
		errs = append(errs, fmt.Errorf("from.stopId is unset"))
	}
	if svc.To.StopID == 0 {
		errs = append(errs, fmt.Errorf("to.stopId is unset"))
	}
	if svc.Direction != "inbound" && svc.Direction != "outbound" {
		errs = append(errs, fmt.Errorf("direction %q is invalid", svc.Direction))
	}
	if len(svc.ValidityPeriods) == 0 {
		errs = append(errs, fmt.Errorf("validityPeriods is empty"))
	}
	for _, vp := range svc.ValidityPeriods {
		from, fromErr := time.Parse("2006-01-02", vp.From)
		if fromErr != nil {
			errs = append(errs, fmt.Errorf("validityPeriods.from %q: invalid date", vp.From))
		}
		to, toErr := time.Parse("2006-01-02", vp.To)
		if toErr != nil {
			errs = append(errs, fmt.Errorf("validityPeriods.to %q: invalid date", vp.To))
		}
		if fromErr == nil && toErr == nil && from.After(to) {
			errs = append(errs, fmt.Errorf("validityPeriods: from %s is after to %s", vp.From, vp.To))
		}
	}
	if len(svc.Segments) == 0 {
		errs = append(errs, fmt.Errorf("segments is empty"))
	}

	totalFixed := 0
	for i, seg := range svc.Segments {
		switch seg.SegmentType {
		case "fixed":
			for j, tp := range seg.Times {
				if err := validateTimePair(tp); err != nil {
					errs = append(errs, fmt.Errorf("segments[%d].times[%d]: %w", i, j, err))
				}
			}
			totalFixed += len(seg.Times)
		case "shuttle":
			if seg.StartTime == "" || seg.EndTime == "" {
				errs = append(errs, fmt.Errorf("segments[%d] shuttle: startTime/endTime required", i))
			} else {
				start, err1 := parseTimeStr(seg.StartTime)
				end, err2 := parseTimeStr(seg.EndTime)
				if err1 != nil {
					errs = append(errs, fmt.Errorf("segments[%d] shuttle.startTime %q: invalid format", i, seg.StartTime))
				}
				if err2 != nil {
					errs = append(errs, fmt.Errorf("segments[%d] shuttle.endTime %q: invalid format", i, seg.EndTime))
				}
				if err1 == nil && err2 == nil && !start.Before(end) {
					errs = append(errs, fmt.Errorf("segments[%d] shuttle: startTime(%s) >= endTime(%s)", i, seg.StartTime, seg.EndTime))
				}
			}
		default:
			errs = append(errs, fmt.Errorf("segments[%d]: unknown segmentType %q", i, seg.SegmentType))
		}
	}

	if totalFixed < minFixedTimesPerService {
		errs = append(errs, fmt.Errorf("too few fixed times: got %d, need at least %d", totalFixed, minFixedTimesPerService))
	}

	return errs
}

func validateTimePair(tp TimePair) error {
	dep, err := parseTimeStr(tp.Departure)
	if err != nil {
		return fmt.Errorf("departure %q: %w", tp.Departure, err)
	}
	arr, err := parseTimeStr(tp.Arrival)
	if err != nil {
		return fmt.Errorf("arrival %q: %w", tp.Arrival, err)
	}
	if !dep.Before(arr) {
		return fmt.Errorf("departure(%s) >= arrival(%s)", tp.Departure, tp.Arrival)
	}
	return nil
}

func parseTimeStr(s string) (time.Time, error) {
	parts := strings.SplitN(s, ":", 2)
	if len(parts) != 2 {
		return time.Time{}, fmt.Errorf("invalid format")
	}
	h, err := strconv.Atoi(strings.TrimSpace(parts[0]))
	if err != nil || h < 0 || h > 23 {
		return time.Time{}, fmt.Errorf("invalid hour")
	}
	m, err := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err != nil || m < 0 || m > 59 {
		return time.Time{}, fmt.Errorf("invalid minute")
	}
	return time.Date(2000, 1, 1, h, m, 0, 0, time.UTC), nil
}
