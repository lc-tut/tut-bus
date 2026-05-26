package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	loadEnvFile(".env")

	if len(os.Args) > 1 && os.Args[1] == "view" {
		runView(os.Args[2:])
		return
	}
	if len(os.Args) > 1 && os.Args[1] == "fetch" {
		runFetch(os.Args[2:])
		return
	}
	if len(os.Args) > 1 && os.Args[1] == "sync" {
		runSync(os.Args[2:])
		return
	}

	pdfPath := flag.String("pdf", "", "PDFファイルのパス (必須)")
	outputDir := flag.String("output", "../../data/services", "出力ディレクトリ")
	apiKey := flag.String("api-key", os.Getenv("GEMINI_API_KEY"), "Gemini API Key")
	validFrom := flag.String("from", "", "有効期間 from (YYYY-MM-DD, 複数はカンマ区切り)")
	validTo := flag.String("to", "", "有効期間 to (YYYY-MM-DD, 複数はカンマ区切り)")
	flag.Parse()

	if *pdfPath == "" {
		log.Fatal("--pdf を指定してください")
	}
	if *apiKey == "" {
		log.Fatal("GEMINI_API_KEY を設定するか --api-key を指定してください")
	}

	periods, err := parsePeriods(*validFrom, *validTo)
	if err != nil {
		log.Fatalf("有効期間の指定が不正です: %v", err)
	}

	pdfData, err := os.ReadFile(*pdfPath)
	if err != nil {
		log.Fatalf("PDF の読み込み失敗: %v", err)
	}
	log.Printf("PDF 読み込み完了: %s (%d bytes)", *pdfPath, len(pdfData))

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(*apiKey))
	if err != nil {
		log.Fatalf("Gemini クライアント作成失敗: %v", err)
	}
	defer client.Close()

	extracted, err := Extract(ctx, client, pdfData)
	if err != nil {
		log.Fatalf("PDF 抽出失敗: %v", err)
	}
	log.Printf("テーブル抽出: %d 件", len(extracted.Tables))

	services, err := Map(extracted, periods)
	if err != nil {
		log.Fatalf("マッピング失敗: %v", err)
	}
	log.Printf("サービス生成: %d 件", len(services))

	if err := os.MkdirAll(*outputDir, 0755); err != nil {
		log.Fatalf("出力ディレクトリ作成失敗: %v", err)
	}

	saved, failed := 0, 0
	for _, svc := range services {
		errs := Validate(svc)
		if len(errs) > 0 {
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

		outPath := filepath.Join(*outputDir, svc.ID+".json")
		if err := os.WriteFile(outPath, data, 0644); err != nil {
			log.Fatalf("ファイル書き込み失敗: %v", err)
		}
		fmt.Printf("  生成: %s.json\n", svc.ID)
		saved++
	}

	fmt.Printf("\n生成: %d 件 / スキップ: %d 件\n", saved, failed)
	fmt.Printf("出力先: %s\n", *outputDir)

	if saved == 0 {
		os.Exit(1)
	}
}

func parsePeriods(froms, tos string) ([]ValidityPeriod, error) {
	if froms == "" && tos == "" {
		return nil, nil
	}
	fs := strings.Split(froms, ",")
	ts := strings.Split(tos, ",")
	if len(fs) != len(ts) {
		return nil, fmt.Errorf("--from と --to の数が一致しません")
	}
	var periods []ValidityPeriod
	for i := range fs {
		periods = append(periods, ValidityPeriod{
			From: strings.TrimSpace(fs[i]),
			To:   strings.TrimSpace(ts[i]),
		})
	}
	return periods, nil
}

func marshalJSON(v interface{}) ([]byte, error) {
	return json.MarshalIndent(v, "", "  ")
}

func loadEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
		if os.Getenv(key) == "" {
			if err := os.Setenv(key, val); err != nil {
				log.Printf("環境変数のセット失敗 (%s): %v", key, err)
			}
		}
	}
	if err := scanner.Err(); err != nil {
		log.Printf(".env 読み込みエラー: %v", err)
	}
}
