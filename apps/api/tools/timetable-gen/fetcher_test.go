package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func readState(t *testing.T, dir string) FetchState {
	t.Helper()
	st := FetchState{PDFs: map[string]PDFState{}}
	b, err := os.ReadFile(filepath.Join(dir, stateFileName))
	if err != nil {
		return st
	}
	if err := json.Unmarshal(b, &st); err != nil {
		t.Fatalf("state のパースに失敗: %v", err)
	}
	return st
}

func samplePDF(dir string) DownloadedPDF {
	return DownloadedPDF{
		Path:   filepath.Join(dir, "260912.pdf"),
		Title:  "9月12日（土）　臨時運行時刻表",
		URL:    "https://www.teu.ac.jp/campus/access/260912.pdf",
		RelURL: "/campus/access/260912.pdf",
		SHA256: "2f9c8acd35d2d839e6a13d37ebcc902ca8e466721563a064b7f9b4534e0b4e3d",
	}
}

// 260627.pdf と 260912.pdf が失われた経路そのもの: 抽出に失敗した PDF が
// state に載ってしまうと、以降の実行が「変更なし」で永久にスキップする。
func TestUnrecordedPDFStaysPending(t *testing.T) {
	dir := t.TempDir()
	pdf := samplePDF(dir)

	if _, ok := readState(t, dir).PDFs[pdf.RelURL]; ok {
		t.Fatal("まだ何も記録していないのに state に載っている")
	}

	RecordProcessed(dir, pdf)

	got, ok := readState(t, dir).PDFs[pdf.RelURL]
	if !ok {
		t.Fatal("生成成功後に記録されていない")
	}
	if got.SHA256 != pdf.SHA256 || got.Title != pdf.Title {
		t.Errorf("記録内容が違う: %+v", got)
	}
}

// fetch サブコマンドは生成しないので state を書いてはいけない。書いてしまうと
// あとから sync を実行しても「変更なし」でスキップされ、1件も生成されない。
func TestFetchDoesNotRecordState(t *testing.T) {
	dir := t.TempDir()
	src, err := os.ReadFile("fetcher.go")
	if err != nil {
		t.Fatalf("fetcher.go を読めない: %v", err)
	}
	if got := string(src); containsRecordCallInRunFetch(got) {
		t.Error("runFetch が RecordProcessed を呼んでいる: fetch 後の sync が全件スキップされる")
	}

	// fetchNewPDFs 自体も state を書かないこと（ネットワークに出ずに確認できる範囲）
	if _, err := os.Stat(filepath.Join(dir, stateFileName)); !os.IsNotExist(err) {
		t.Errorf("state ファイルが予期せず存在する: %v", err)
	}
}

func containsRecordCallInRunFetch(src string) bool {
	start := strings.Index(src, "func runFetch(")
	if start < 0 {
		return false
	}
	body := src[start:]
	if end := strings.Index(body[1:], "\nfunc "); end >= 0 {
		body = body[:end+1]
	}
	return strings.Contains(body, "RecordProcessed(")
}
