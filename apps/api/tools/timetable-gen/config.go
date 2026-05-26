package main

import (
	"fmt"
	"strings"
)


// StationRoute holds the stop IDs and display names for one station's route.
type StationRoute struct {
	Key           string // kebab-case key used in service IDs
	StationStopID int
	StationName   string
	SchoolStopID  int
	SchoolName    string
}

// stationRoutes maps canonical station names to their route config.
var stationRoutes = map[string]StationRoute{
	"八王子みなみ野駅": {
		Key:           "minamino",
		StationStopID: 2,
		StationName:   "八王子みなみ野駅",
		SchoolStopID:  5,
		SchoolName:    "大学（みなみ野駅方面）",
	},
	"八王子駅": {
		Key:           "hachioji",
		StationStopID: 1,
		StationName:   "八王子駅",
		SchoolStopID:  3,
		SchoolName:    "大学（八王子駅方面）",
	},
	"学生会館": {
		Key:           "gakuseikaikan",
		StationStopID: 6,
		StationName:   "学生会館",
		SchoolStopID:  4,
		SchoolName:    "大学（学生会館方面）",
	},
}

// stationAliases maps alternate names Gemini might return to canonical names.
var stationAliases = map[string]string{
	"八王子みなみ野":    "八王子みなみ野駅",
	"みなみ野駅":      "八王子みなみ野駅",
	"みなみ野":       "八王子みなみ野駅",
	"八王子駅南口":     "八王子駅",
	"八王子南口":      "八王子駅",
	"hachioji":   "八王子駅",
	"学生会館前":      "学生会館",
	"gakuseikaikan": "学生会館",
}

func lookupStation(name string) (StationRoute, error) {
	if r, ok := stationRoutes[name]; ok {
		return r, nil
	}
	// try aliases
	if canonical, ok := stationAliases[name]; ok {
		if r, ok := stationRoutes[canonical]; ok {
			return r, nil
		}
	}
	// fuzzy: check if any canonical name is contained
	for canonical, r := range stationRoutes {
		if strings.Contains(name, canonical) || strings.Contains(canonical, name) {
			return r, nil
		}
	}
	return StationRoute{}, fmt.Errorf("unknown station %q", name)
}

var dayTypeLabel = map[string]string{
	"weekday":  "平日",
	"saturday": "土曜",
	"holiday":  "休日",
}

// scheduleLabel builds the suffix used in service IDs.
//
// specificPeriod schedules use their date directly (already unique).
// Regular dayType schedules append the validity start date so that
// "summer weekday" and "regular weekday" never share the same ID.
func scheduleLabel(table ExtractedTable) string {
	if table.SpecificFrom != "" {
		if table.SpecificFrom == table.SpecificTo || table.SpecificTo == "" {
			return table.SpecificFrom
		}
		return table.SpecificFrom + "_" + table.SpecificTo
	}
	// Include validFrom so different semester schedules coexist in the DB.
	// Falls back to dayType-only when the PDF has no extractable start date.
	if table.ValidFrom != "" {
		date := strings.ReplaceAll(table.ValidFrom, "-", "")
		return table.DayType + "-" + date
	}
	return table.DayType
}

func scheduleDisplayLabel(table ExtractedTable) string {
	if table.SpecificFrom != "" {
		if table.SpecificFrom == table.SpecificTo || table.SpecificTo == "" {
			return table.SpecificFrom
		}
		return table.SpecificFrom + "〜" + table.SpecificTo
	}
	label := dayTypeLabel[table.DayType]
	if label == "" {
		label = table.DayType
	}
	if table.ValidFrom != "" {
		return label + " " + table.ValidFrom + "〜"
	}
	return label
}

func outboundServiceID(route StationRoute, table ExtractedTable) string {
	return fmt.Sprintf("school-to-%s-%s", route.Key, scheduleLabel(table))
}

func outboundServiceName(route StationRoute, table ExtractedTable) string {
	return fmt.Sprintf("%s → %s (%s)", route.SchoolName, route.StationName, scheduleDisplayLabel(table))
}

func inboundServiceID(route StationRoute, table ExtractedTable) string {
	return fmt.Sprintf("%s-to-school-%s", route.Key, scheduleLabel(table))
}

func inboundServiceName(route StationRoute, table ExtractedTable) string {
	return fmt.Sprintf("%s → %s (%s)", route.StationName, route.SchoolName, scheduleDisplayLabel(table))
}
