package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"time"
)

// Bounds the Python subprocess: sync.go processes PDFs sequentially, so a
// hung pdfplumber call would otherwise freeze the whole batch.
const geoExtractTimeout = 30 * time.Second

const geoExtractScript = "extractor/geo_extract.py"

// geoOutput mirrors geo_extract.py's stdout contract: ExtractedData plus a
// "warnings" field it doesn't have.
type geoOutput struct {
	ExtractedData
	Warnings []string `json:"warnings,omitempty"`
}

// ExtractGeo runs the coordinate-based Python extractor and decodes its
// stdout into ExtractedData. Requires no API key and makes no network call.
// A non-zero exit, unparseable stdout, or any reported warning is an error.
func ExtractGeo(ctx context.Context, pdfPath string) (*ExtractedData, error) {
	ctx, cancel := context.WithTimeout(ctx, geoExtractTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "python3", geoExtractScript, pdfPath)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return nil, fmt.Errorf("geo_extract.py がタイムアウトしました (%s): %w", geoExtractTimeout, ctx.Err())
		}
		return nil, fmt.Errorf("geo_extract.py 実行失敗: %w (stderr: %s)", err, stderr.String())
	}

	var out geoOutput
	if err := json.Unmarshal(stdout.Bytes(), &out); err != nil {
		return nil, fmt.Errorf("geo_extract.py の出力パース失敗: %w", err)
	}

	if len(out.Tables) == 0 {
		return nil, fmt.Errorf("geo_extract.py: テーブルが1つも抽出されませんでした")
	}
	if len(out.Warnings) > 0 {
		return nil, fmt.Errorf("geo_extract.py が異常を検知しました: %v", out.Warnings)
	}

	return &out.ExtractedData, nil
}

// extractWithMode runs the coordinate extractor, falling back per fallback.go
// when it cannot produce usable tables.
func extractWithMode(ctx context.Context, pdfPath string) (*ExtractedData, error) {
	extracted, err := ExtractGeo(ctx, pdfPath)
	if err != nil {
		return geoFallback(pdfPath, err)
	}

	var findings []RowFinding
	for _, table := range extracted.Tables {
		findings = append(findings, CheckRows(table.StationName, table.Segments)...)
	}
	for _, f := range findings {
		log.Printf("行整合性チェック [%s] %s: %s", pdfPath, f.Severity, f.Message)
	}
	// Only errors reject the PDF; duration warnings are logged only (see CheckRows).
	if HasError(findings) {
		return geoFallback(pdfPath, fmt.Errorf("row_check: 行整合性エラーを検知しました"))
	}

	return extracted, nil
}

// geoFallback attempts defaultFallback.Extract() after an anomaly, logging
// why the fallback was triggered either way.
func geoFallback(pdfPath string, reason error) (*ExtractedData, error) {
	log.Printf("座標抽出で異常を検知しました %s: %v", pdfPath, reason)
	extracted, fbErr := defaultFallback.Extract(pdfPath, reason.Error())
	if fbErr != nil {
		return nil, fmt.Errorf("フォールバック未実装のためスキップします（原因: %v）: %w", reason, fbErr)
	}
	return extracted, nil
}
