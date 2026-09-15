package main

import "errors"

// Intentionally not implemented - see issue #213. Do not add a real
// model/Ollama call here without updating the plan doc's scope.
var errNotImplemented = errors.New("LLM フォールバックは未実装です (issue #213)")

// FallbackExtractor re-processes a PDF when coordinate-based extraction
// reports an anomaly. Not implemented yet - see issue #213.
type FallbackExtractor interface {
	Extract(pdfPath string, reason string) (*ExtractedData, error)
}

type stubFallbackExtractor struct{}

func (stubFallbackExtractor) Extract(pdfPath string, reason string) (*ExtractedData, error) {
	return nil, errNotImplemented
}

// defaultFallback fires on the three anomaly conditions from the plan doc:
// column-count mismatch, zero tables found, or a row_check finding.
var defaultFallback FallbackExtractor = stubFallbackExtractor{}
