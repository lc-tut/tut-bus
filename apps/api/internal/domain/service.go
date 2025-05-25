package domain

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// DayType 曜日の種類を定義
type DayType string

const (
	DayTypeWeekday   DayType = "weekday"
	DayTypeSaturday  DayType = "saturday"
	DayTypeSunday    DayType = "sunday"
	DayTypeHoliday   DayType = "holiday"
	DayTypeMonday    DayType = "monday"
	DayTypeTuesday   DayType = "tuesday"
	DayTypeWednesday DayType = "wednesday"
	DayTypeThursday  DayType = "thursday"
	DayTypeFriday    DayType = "friday"
)

// SegmentConditionType セグメント条件の種類を定義
type SegmentConditionType string

const (
	ConditionTypeDayType        SegmentConditionType = "dayType"
	ConditionTypeSpecificDate   SegmentConditionType = "specificDate"
	ConditionTypeSpecificPeriod SegmentConditionType = "specificPeriod"
)

// ServiceStopRef はバス停の参照情報を表します
type ServiceStopRef struct {
	StopID      int32  `json:"stopId"`
	DisplayName string `json:"displayName"`
}

// ServiceValidityPeriod はサービスの有効期間を表します
type ServiceValidityPeriod struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// SegmentCondition はセグメントの条件の基本情報を表します
type SegmentCondition struct {
	Type  SegmentConditionType `json:"type"`
	Value string               `json:"value,omitempty"`
	From  string               `json:"from,omitempty"`
	To    string               `json:"to,omitempty"`
}

// SegmentConditionDayType は曜日タイプ条件を表します
type SegmentConditionDayType struct {
	Type  SegmentConditionType `json:"type"`
	Value DayType              `json:"value"`
}

// SegmentConditionSpecificDate は特定日条件を表します
type SegmentConditionSpecificDate struct {
	Type  SegmentConditionType `json:"type"`
	Value string               `json:"value"` // ISO8601形式の日付文字列（YYYY-MM-DD）
}

// SegmentConditionSpecificPeriod は特定期間条件を表します
type SegmentConditionSpecificPeriod struct {
	Type SegmentConditionType `json:"type"`
	From string               `json:"from"` // ISO8601形式の日付文字列（YYYY-MM-DD）
	To   string               `json:"to"`   // ISO8601形式の日付文字列（YYYY-MM-DD）
}

// TimePair は出発と到着の時刻ペアを表します
type TimePair struct {
	Departure string `json:"departure"`
	Arrival   string `json:"arrival"`
}

// Interval は間隔の範囲を表します
type Interval struct {
	Min int `json:"min"`
	Max int `json:"max"`
}

// ServiceSegment はサービスのセグメントの基本情報を表します
type ServiceSegment struct {
	SegmentType string           `json:"segmentType"`
	Condition   SegmentCondition `json:"condition"`
}

// FixedSegment は固定時刻のセグメントを表します
type FixedSegment struct {
	ServiceSegment
	Times []TimePair `json:"times"`
}

// ShuttleSegment はシャトルバスのセグメントを表します
type ShuttleSegment struct {
	ServiceSegment
	StartTime     string   `json:"startTime"`
	EndTime       string   `json:"endTime"`
	IntervalRange Interval `json:"intervalRange"`
	Note          string   `json:"note,omitempty"`
}

// ServiceData はバスサービスのデータを表します
type ServiceData struct {
	ID              string                  `json:"id"`
	Name            string                  `json:"name"`
	From            ServiceStopRef          `json:"from"`
	To              ServiceStopRef          `json:"to"`
	Direction       string                  `json:"direction"`
	ValidityPeriods []ServiceValidityPeriod `json:"validityPeriods"`
	Segments        []json.RawMessage       `json:"segments"`
	ParsedSegments  []interface{}           `json:"-"`
}

// serviceCache はサービスデータのキャッシュ
var serviceCache []ServiceData
var serviceCacheLocked bool = false

// LoadServiceData はJSONファイルからサービスデータを読み込みます
func LoadServiceData(dataDir string) ([]ServiceData, error) {

	if serviceCacheLocked && len(serviceCache) > 0 {
		return serviceCache, nil
	}

	servicesDir := filepath.Join(dataDir, "services")
	files, err := os.ReadDir(servicesDir)
	if err != nil {
		return nil, err
	}

	var services []ServiceData
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".json") {
			continue
		}

		filePath := filepath.Join(servicesDir, file.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			return nil, err
		}

		var service ServiceData
		if err := json.Unmarshal(data, &service); err != nil {
			return nil, err
		}

		for _, segmentRaw := range service.Segments {
			var segmentBase ServiceSegment
			if err := json.Unmarshal(segmentRaw, &segmentBase); err != nil {
				return nil, err
			}

			switch segmentBase.SegmentType {
			case "fixed":
				var fixedSegment FixedSegment
				if err := json.Unmarshal(segmentRaw, &fixedSegment); err != nil {
					return nil, err
				}
				service.ParsedSegments = append(service.ParsedSegments, &fixedSegment)
			case "shuttle":
				var shuttleSegment ShuttleSegment
				if err := json.Unmarshal(segmentRaw, &shuttleSegment); err != nil {
					return nil, err
				}
				service.ParsedSegments = append(service.ParsedSegments, &shuttleSegment)
			default:
				return nil, fmt.Errorf("未知のセグメントタイプ: %s", segmentBase.SegmentType)
			}
		}

		services = append(services, service)
	}

	serviceCache = services
	serviceCacheLocked = true

	return services, nil
}

// IsValidForDate は指定された日付にサービスが有効かどうかを確認します
func (s *ServiceData) IsValidForDate(date time.Time) bool {
	if len(s.ValidityPeriods) == 0 {
		return true
	}

	dateStr := date.Format("2006-01-02")
	for _, period := range s.ValidityPeriods {
		if period.From != "" && period.To != "" {
			if dateStr >= period.From && dateStr <= period.To {
				return true
			}
		} else if period.From != "" {
			if dateStr >= period.From {
				return true
			}
		} else if period.To != "" {
			if dateStr <= period.To {
				return true
			}
		}
	}
	return false
}

// GetDayType は指定された日付の曜日タイプを返します
func GetDayType(date time.Time) DayType {
	weekday := date.Weekday()

	switch weekday {
	case time.Monday:
		return DayTypeMonday
	case time.Tuesday:
		return DayTypeTuesday
	case time.Wednesday:
		return DayTypeWednesday
	case time.Thursday:
		return DayTypeThursday
	case time.Friday:
		return DayTypeFriday
	case time.Saturday:
		return DayTypeSaturday
	case time.Sunday:
		return DayTypeSunday
	default:
		return DayTypeWeekday // 念のため
	}
	// 注: 祝日の判定は別途ロジックが必要です
}

// IsWeekday は指定された曜日が平日（月〜金）かどうかを判定します
func IsWeekday(dayType DayType) bool {
	return dayType == DayTypeMonday || dayType == DayTypeTuesday ||
		dayType == DayTypeWednesday || dayType == DayTypeThursday || dayType == DayTypeFriday
}

// IsSegmentValidForDate は指定された日付にこのセグメントが有効かどうかを判断します
func IsSegmentValidForDate(condition SegmentCondition, date time.Time) bool {
	dateStr := date.Format("2006-01-02")
	dayType := GetDayType(date)

	switch condition.Type {
	case ConditionTypeDayType:
		// 特別ケース: "weekday" は月〜金のどれかに一致するか
		if condition.Value == string(DayTypeWeekday) {
			return IsWeekday(dayType)
		}
		return condition.Value == string(dayType)

	case ConditionTypeSpecificDate:
		return dateStr == condition.Value

	case ConditionTypeSpecificPeriod:
		if condition.From != "" && condition.To != "" {
			return dateStr >= condition.From && dateStr <= condition.To
		} else if condition.From != "" {
			return dateStr >= condition.From
		} else if condition.To != "" {
			return dateStr <= condition.To
		}
	}

	// 後方互換性のため
	if condition.Type == "" && condition.Value != "" {
		if condition.Value == string(DayTypeWeekday) {
			return IsWeekday(dayType)
		}
		return condition.Value == string(dayType)
	}

	return true
}

// ErrInvalidDate は無効な日付形式エラーを表します
var ErrInvalidDate = &ServiceError{
	Code:    "InvalidDate",
	Message: "The date format is invalid.",
}

// ParseDateString は日付文字列をtime.Time型に変換します
func ParseDateString(dateStr string) (time.Time, error) {
	if dateStr == "" {
		return time.Now(), nil
	}

	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return time.Time{}, ErrInvalidDate
	}
	return t, nil
}
