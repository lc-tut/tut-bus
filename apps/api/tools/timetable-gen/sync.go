package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func runSync(args []string) {
	downloadDir := "downloaded"
	outputDir := "../../data/services"
	apiKey := os.Getenv("GEMINI_API_KEY")
	restartAPI := false

	for i, a := range args {
		switch a {
		case "--download-dir":
			if i+1 < len(args) {
				downloadDir = args[i+1]
			}
		case "--output":
			if i+1 < len(args) {
				outputDir = args[i+1]
			}
		case "--api-key":
			if i+1 < len(args) {
				apiKey = args[i+1]
			}
		case "--restart-api":
			restartAPI = true
		}
	}

	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY を設定するか --api-key を指定してください")
	}

	// 1. 新規・更新 PDF をフェッチ
	newFiles, _, err := fetchNewPDFs(downloadDir)
	if err != nil {
		log.Fatalf("fetch 失敗: %v", err)
	}
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		log.Fatalf("出力ディレクトリ作成失敗: %v", err)
	}

	// 2. 期限切れサービスをアーカイブ（新規PDFがなくても実行）
	archived := archiveExpired(outputDir)
	if archived > 0 {
		fmt.Printf("アーカイブ: %d 件\n", archived)
	}

	if len(newFiles) == 0 {
		fmt.Println("新規・更新 PDF なし。終了します。")
		return
	}
	fmt.Printf("新規・更新 PDF: %d 件\n", len(newFiles))

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Fatalf("Gemini クライアント作成失敗: %v", err)
	}
	defer client.Close()

	// 3. 各 PDF を JSON に変換
	totalSaved, totalFailed := 0, 0
	for _, pdf := range newFiles {
		fmt.Printf("\n--- %s (%s) ---\n", filepath.Base(pdf.Path), pdf.Title)

		saved, failed := generateFromPDF(ctx, client, pdf.Path, outputDir)
		totalSaved += saved
		totalFailed += failed
	}

	fmt.Printf("\n合計: 生成 %d 件 / スキップ %d 件\n", totalSaved, totalFailed)

	// 4. API 再起動
	if restartAPI && totalSaved > 0 {
		fmt.Println("API コンテナを再起動しています...")
		if out, err := exec.Command("docker", "restart", "api").CombinedOutput(); err != nil {
			log.Printf("API 再起動失敗: %v\n%s", err, out)
		} else {
			fmt.Println("API 再起動完了")
		}
	} else if totalSaved > 0 {
		fmt.Println("\n※ API を再起動してください: docker restart api")
	}
}

func archiveExpired(servicesDir string) int {
	today := time.Now().Format("2006-01-02")
	archiveDir := filepath.Join(servicesDir, "archived")

	entries, err := os.ReadDir(servicesDir)
	if err != nil {
		log.Printf("ディレクトリ読み込み失敗: %v", err)
		return 0
	}

	count := 0
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".json" {
			continue
		}

		path := filepath.Join(servicesDir, e.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}

		var svc struct {
			ValidityPeriods []struct {
				To string `json:"to"`
			} `json:"validityPeriods"`
		}
		if err := json.Unmarshal(data, &svc); err != nil || len(svc.ValidityPeriods) == 0 {
			continue
		}

		// 全期間の最大 to を求める
		var maxTo time.Time
		for _, vp := range svc.ValidityPeriods {
			t, err := time.Parse("2006-01-02", vp.To)
			if err != nil {
				continue
			}
			if t.After(maxTo) {
				maxTo = t
			}
		}
		todayTime, _ := time.Parse("2006-01-02", today)
		if maxTo.IsZero() || !maxTo.Before(todayTime) {
			continue
		}

		if err := os.MkdirAll(archiveDir, 0755); err != nil {
			log.Printf("archived/ 作成失敗: %v", err)
			continue
		}
		dst := filepath.Join(archiveDir, e.Name())
		if err := os.Rename(path, dst); err != nil {
			log.Printf("アーカイブ失敗 %s: %v", e.Name(), err)
			continue
		}
		fmt.Printf("  アーカイブ: %s (期限: %s)\n", e.Name(), maxTo.Format("2006-01-02"))
		count++
	}
	return count
}

func generateFromPDF(ctx context.Context, client *genai.Client, pdfPath, outputDir string) (saved, failed int) {
	pdfData, err := os.ReadFile(pdfPath)
	if err != nil {
		log.Printf("PDF 読み込み失敗 %s: %v", pdfPath, err)
		return 0, 1
	}

	extracted, err := Extract(ctx, client, pdfData)
	if err != nil {
		log.Printf("抽出失敗 %s: %v", pdfPath, err)
		return 0, 1
	}

	services, err := Map(extracted, nil)
	if err != nil {
		log.Printf("マッピング失敗 %s: %v", pdfPath, err)
		return 0, 1
	}

	for _, svc := range services {
		if errs := Validate(svc); len(errs) > 0 {
			log.Printf("バリデーションエラー [%s]:", svc.ID)
			for _, e := range errs {
				log.Printf("  - %v", e)
			}
			failed++
			continue
		}

		data, err := marshalJSON(svc)
		if err != nil {
			log.Printf("JSON 整形失敗 [%s]: %v", svc.ID, err)
			failed++
			continue
		}

		outPath := filepath.Join(outputDir, svc.ID+".json")
		if err := os.WriteFile(outPath, data, 0644); err != nil {
			log.Printf("書き込み失敗 [%s]: %v", svc.ID, err)
			failed++
			continue
		}
		fmt.Printf("  生成: %s.json\n", svc.ID)
		saved++
	}
	return saved, failed
}
