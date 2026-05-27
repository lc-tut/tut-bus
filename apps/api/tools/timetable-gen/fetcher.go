package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const (
	timetablePageURL = "https://www.teu.ac.jp/campus/access/006644.html"
	baseURL          = "https://www.teu.ac.jp"
	stateFileName    = ".fetch-state.json"
)

type PDFState struct {
	Title        string `json:"title"`
	SHA256       string `json:"sha256"`
	DownloadedAt string `json:"downloadedAt"`
}

type FetchState struct {
	PDFs map[string]PDFState `json:"pdfs"` // keyed by relative URL
}

type PDFLink struct {
	URL   string // relative URL e.g. /campus/access/260407.pdf
	Title string
}

// rePDFLink matches <a href="...pdf"...>title</a> (not inside HTML comments)
var rePDFLink = regexp.MustCompile(`<a\s+href="(/campus/access/[^"]+\.pdf)"[^>]*>([^<]+)</a>`)

type DownloadedPDF struct {
	Path  string
	Title string
}

func runFetch(args []string) {
	outputDir := "downloaded"
	for i, a := range args {
		if a == "--output" && i+1 < len(args) {
			outputDir = args[i+1]
		}
	}

	newFiles, skipped, err := fetchNewPDFs(outputDir)
	if err != nil {
		log.Fatalf("fetch 失敗: %v", err)
	}

	fmt.Printf("\nダウンロード: %d 件 / スキップ: %d 件\n", len(newFiles), skipped)
	fmt.Printf("保存先: %s\n", outputDir)
}

// fetchNewPDFs は新規・更新 PDF をダウンロードし、そのパス一覧を返す。
func fetchNewPDFs(outputDir string) (newFiles []DownloadedPDF, skipped int, err error) {
	if err = os.MkdirAll(outputDir, 0755); err != nil {
		return nil, 0, fmt.Errorf("出力ディレクトリ作成失敗: %w", err)
	}

	links, err := scrapePDFLinks()
	if err != nil {
		return nil, 0, fmt.Errorf("ページ取得失敗: %w", err)
	}
	log.Printf("PDF リンク検出: %d 件", len(links))

	stateFile := filepath.Join(outputDir, stateFileName)
	state := loadFetchState(stateFile)

	for _, link := range links {
		fullURL := baseURL + link.URL
		filename := filepath.Base(link.URL)
		outPath := filepath.Join(outputDir, filename)

		data, dlErr := downloadFile(fullURL)
		if dlErr != nil {
			log.Printf("ダウンロード失敗 %s: %v", fullURL, dlErr)
			continue
		}

		hash := sha256sum(data)
		prev, known := state.PDFs[link.URL]

		if known && prev.SHA256 == hash {
			log.Printf("変更なし: %s", filename)
			skipped++
			continue
		}

		if writeErr := os.WriteFile(outPath, data, 0644); writeErr != nil {
			log.Printf("保存失敗 %s: %v", outPath, writeErr)
			continue
		}

		state.PDFs[link.URL] = PDFState{
			Title:        link.Title,
			SHA256:       hash,
			DownloadedAt: time.Now().Format(time.RFC3339),
		}

		action := "新規"
		if known {
			action = "更新"
		}
		fmt.Printf("  [%s] %s  (%s)\n", action, filename, link.Title)
		newFiles = append(newFiles, DownloadedPDF{Path: outPath, Title: link.Title})
	}

	if saveErr := saveFetchState(stateFile, state); saveErr != nil {
		log.Printf("状態ファイル保存失敗: %v", saveErr)
	}

	return newFiles, skipped, nil
}

func scrapePDFLinks() ([]PDFLink, error) {
	resp, err := http.Get(timetablePageURL)
	if err != nil {
		return nil, fmt.Errorf("HTTP GET 失敗: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("レスポンス読み込み失敗: %w", err)
	}

	// HTML コメントを除去してからリンクを抽出（コメントアウト済みリンクを無視）
	stripped := removeHTMLComments(string(body))

	matches := rePDFLink.FindAllStringSubmatch(stripped, -1)
	var links []PDFLink
	seen := map[string]bool{}
	for _, m := range matches {
		url := m[1]
		if seen[url] {
			continue
		}
		seen[url] = true
		links = append(links, PDFLink{
			URL:   url,
			Title: strings.TrimSpace(m[2]),
		})
	}
	return links, nil
}

// removeHTMLComments は <!-- ... --> を除去する
var reComment = regexp.MustCompile(`(?s)<!--.*?-->`)

func removeHTMLComments(html string) string {
	return reComment.ReplaceAllString(html, "")
}

const maxBodyBytes = 50 * 1024 * 1024 // 50 MB

func downloadFile(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, maxBodyBytes+1))
	if err != nil {
		return nil, err
	}
	if int64(len(data)) > maxBodyBytes {
		return nil, fmt.Errorf("ファイルサイズが %d MB を超えています", maxBodyBytes/1024/1024)
	}
	return data, nil
}

func sha256sum(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func loadFetchState(path string) FetchState {
	state := FetchState{PDFs: map[string]PDFState{}}
	data, err := os.ReadFile(path)
	if err != nil {
		return state
	}
	_ = json.Unmarshal(data, &state)
	if state.PDFs == nil {
		state.PDFs = map[string]PDFState{}
	}
	return state
}

func saveFetchState(path string, state FetchState) error {
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
