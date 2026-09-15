package main

import "testing"

// realMinaminoWeekdayRows is real data (八王子みなみ野駅, weekday, 260407.pdf)
// used as the "must not false-positive" baseline throughout - see
// docs/ocr-extraction-verification-report.md section 8.2.
func realMinaminoWeekdayRows() [][]string {
	return [][]string{
		{"7:22", "7:29", "7:39"},
		{"7:31", "7:38", "7:48"},
		{"7:38", "7:45", "7:55"},
		{"7:46", "7:53", "8:03"},
		{"7:52", "7:59", "8:09"},
		{"8:00", "8:07", "8:17"},
		{"8:09", "8:16", "8:26"},
	}
}

func fixedSeg(rows [][]string) []ExtractedSegment {
	return []ExtractedSegment{{Type: "fixed", Rows: rows}}
}

func TestCheckRows_NoFalsePositivesOnRealData(t *testing.T) {
	findings := CheckRows("minamino", fixedSeg(realMinaminoWeekdayRows()))
	if len(findings) != 0 {
		t.Errorf("expected no findings on real data, got: %+v", findings)
	}
}

func TestCheckRows_LegitimateGapVarianceNotFlagged(t *testing.T) {
	// 4min and 14min gaps in the same table - real, legitimate variance that
	// a departure-interval-statistics check would false-positive on (this is
	// exactly why that approach was rejected - see plan doc section 2.4).
	rows := [][]string{
		{"12:01", "12:08", "12:18"},
		{"12:06", "12:13", "12:23"}, // 5min after previous
		{"12:16", "12:23", "12:33"}, // 10min gap - still a valid dep->mid=7, mid->arr=10
		{"12:30", "12:37", "12:47"}, // 14min gap
	}
	findings := CheckRows("gap-variance", fixedSeg(rows))
	if len(findings) != 0 {
		t.Errorf("expected no findings for legitimate gap variance, got: %+v", findings)
	}
}

func TestCheckRows_FabricatedRowDetected(t *testing.T) {
	// Mirrors the qwen3-vl:8b fabrication caught during verification: a row
	// whose mid->arr duration (14min) breaks the table's uniform 10min.
	rows := append(append([][]string{}, realMinaminoWeekdayRows()[:6]...),
		[]string{"14:43", "14:50", "15:04"}, // mid->arr = 14min, not 10min
	)
	// Pad with more uniform rows so the mode has enough support (>=3 rows,
	// dominant share >=60%).
	rows = append(rows,
		[]string{"15:10", "15:17", "15:27"},
		[]string{"15:20", "15:27", "15:37"},
	)
	findings := CheckRows("fabricated", fixedSeg(rows))
	if len(findings) == 0 {
		t.Fatal("expected the fabricated row to be flagged, got no findings")
	}
	found := false
	for _, f := range findings {
		if f.Index == 6 {
			found = true
		}
	}
	if !found {
		t.Errorf("expected a finding at row index 6, got: %+v", findings)
	}
}

func TestCheckRows_DuplicateRowDetected(t *testing.T) {
	rows := [][]string{
		{"7:22", "7:29", "7:39"},
		{"7:31", "7:38", "7:48"},
		{"7:31", "7:38", "7:48"}, // exact duplicate of previous
		{"7:46", "7:53", "8:03"},
	}
	findings := CheckRows("dup", fixedSeg(rows))
	if len(findings) == 0 {
		t.Fatal("expected the duplicate row to be flagged")
	}
	found := false
	for _, f := range findings {
		if f.Index == 2 {
			found = true
		}
	}
	if !found {
		t.Errorf("expected a finding at row index 2, got: %+v", findings)
	}
}

func TestCheckRows_OutOfOrderDetected(t *testing.T) {
	rows := [][]string{
		{"7:22", "7:29", "7:39"},
		{"7:31", "7:38", "7:48"},
		{"7:10", "7:17", "7:27"}, // earlier than the previous row - out of order
		{"7:46", "7:53", "8:03"},
	}
	findings := CheckRows("order", fixedSeg(rows))
	if len(findings) == 0 {
		t.Fatal("expected the out-of-order row to be flagged")
	}
	found := false
	for _, f := range findings {
		if f.Index == 2 {
			found = true
		}
	}
	if !found {
		t.Errorf("expected a finding at row index 2, got: %+v", findings)
	}
}

func TestCheckRows_ShuttleRowsResetSegments(t *testing.T) {
	// A shuttle separator row should split the check into independent
	// sub-segments, not be treated as a malformed data row itself, and not
	// let a duration/order comparison leak across the shuttle break.
	rows := [][]string{
		{"7:22", "7:29", "7:39"},
		{"7:31", "7:38", "7:48"},
		{"～", "～", "～", "約3〜5分間隔"},
		{"9:15", "9:22", "9:32"}, // earlier-looking gap is fine - new sub-segment
		{"9:26", "9:33", "9:43"},
	}
	findings := CheckRows("shuttle", fixedSeg(rows))
	if len(findings) != 0 {
		t.Errorf("expected no findings around a shuttle break, got: %+v", findings)
	}
}

func TestCheckRows_OmissionNotDetectable(t *testing.T) {
	// Documents the known limitation (see CheckRows doc comment): removing a
	// row entirely leaves no trace to flag. This is not a bug - it's the
	// documented gap, verified here so a future "fix" isn't attempted
	// without updating the docs.
	full := append(append([][]string{}, realMinaminoWeekdayRows()...),
		[]string{"9:15", "9:22", "9:32"},
		[]string{"9:26", "9:33", "9:43"},
	)
	withOmission := append(append([][]string{}, full[:3]...), full[4:]...) // drop row 3
	findings := CheckRows("omission", fixedSeg(withOmission))
	if len(findings) != 0 {
		t.Errorf("omission is expected to be undetectable by CheckRows, but got findings: %+v", findings)
	}
}
