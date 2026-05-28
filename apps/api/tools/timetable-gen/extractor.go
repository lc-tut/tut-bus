package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
)

const extractionPrompt = `このPDFは東京工科大学スクールバスの時刻表です。全テーブルを抽出してください。

1. ページ構成
1枚のPDFに複数の駅・複数の曜日種別が含まれます。
それぞれを独立した table として抽出してください。
例: 平日の「八王子みなみ野駅」「八王子駅南口」「学生会館」と土曜の「八王子みなみ野駅」
→ 合計4つの table を出力する

2. 列構成
時刻は必ず3列あります（列名は駅によって異なるが意味は同じ）:
  列1 = キャンパス発（大学の出発時刻）
  列2 = 駅発着または会館発着（中間地点の時刻）
  列3 = キャンパス着（大学への到着時刻）
  列4 = 備考（注記欄） → 無視する
列1・列2・列3の順番を絶対に入れ替えないこと。

3. スケジュール種別
通常スケジュール（月〜金曜日・土曜日・休日等）:
  dayType に "weekday"/"saturday"/"holiday" を設定
  specificFrom / specificTo は空のまま

特定日スケジュール（「5月23日」「紅華祭」等の特定イベント）:
  dayType は空のまま
  specificFrom / specificTo に "YYYY-MM-DD" 形式で設定（1日のみなら同じ日付を両方）

4. segments の種類

type="fixed": 時刻が行ごとに列挙されている区間（シャトル区間も含む）
  rows に [[列1, 列2, 列3], ...] を格納する
  欠損セルは空文字 "" で埋め必ず3要素にする
  「～ ～ ～」という区切り行が現れた場合は ["～", "～", "～", "<備考テキスト>"] として rows に含める
    備考欄に「約N〜M分間隔」「約N分間隔」等があればそのまま4列目に入れる。なければ "" を入れる
    例: ["～", "～", "～", "約3〜5分間隔"]
  シャトル区間の時刻行も通常の fixed rows として扱う
  備考欄の「シャトル運行」注記は無視する

type="shuttle": 使用しない（すべて fixed として抽出する）

5. 有効期間の抽出（重要）
PDFのタイトルや見出しに「4月7日〜7月29日運行」等の運行期間が書かれている場合:
  validFrom / validTo に "YYYY-MM-DD" 形式で設定すること
  年が省略されている場合はPDFの年度から補完する（例: 2026年度なら2026-XX-XX）
  同一PDF内の全テーブルに同じ validFrom / validTo を設定する

6. 注意事項
- 時刻はPDFから読み取ったままの形式（例: "7:30", "14:05"）
- 空欄・「-」のセルは空文字 ""
- 「～ ～ ～」の区切り行は ["～", "～", "～"] として rows に必ず含める
`

func extractionSchema() *genai.Schema {
	str := func() *genai.Schema { return &genai.Schema{Type: genai.TypeString} }
	integer := func() *genai.Schema { return &genai.Schema{Type: genai.TypeInteger} }

	rowSchema := &genai.Schema{
		Type:  genai.TypeArray,
		Items: str(),
	}
	rowsSchema := &genai.Schema{
		Type:  genai.TypeArray,
		Items: rowSchema,
	}

	segmentSchema := &genai.Schema{
		Type: genai.TypeObject,
		Properties: map[string]*genai.Schema{
			"type":        {Type: genai.TypeString, Enum: []string{"fixed"}},
			"rows":        rowsSchema,
			"startTime":   str(),
			"endTime":     str(),
			"intervalMin": integer(),
			"intervalMax": integer(),
			"note":        str(),
		},
		Required: []string{"type"},
	}

	tableSchema := &genai.Schema{
		Type: genai.TypeObject,
		Properties: map[string]*genai.Schema{
			"stationName":  str(),
			"dayType":      {Type: genai.TypeString, Enum: []string{"weekday", "saturday", "holiday"}},
			"specificFrom": str(), // YYYY-MM-DD for specific-date schedules
			"specificTo":   str(), // YYYY-MM-DD for specific-date schedules
			"validFrom":    str(),
			"validTo":      str(),
			"segments": {
				Type:  genai.TypeArray,
				Items: segmentSchema,
			},
		},
		Required: []string{"stationName", "segments"},
	}

	return &genai.Schema{
		Type: genai.TypeObject,
		Properties: map[string]*genai.Schema{
			"tables": {
				Type:  genai.TypeArray,
				Items: tableSchema,
			},
		},
		Required: []string{"tables"},
	}
}

// Extract calls Gemini to extract raw table data from the PDF.
// Gemini outputs structured intermediate data; column interpretation is left to mapper.go.
func Extract(ctx context.Context, client *genai.Client, pdfData []byte) (*ExtractedData, error) {
	model := client.GenerativeModel("gemini-3.1-pro-preview")
	model.ResponseMIMEType = "application/json"
	model.ResponseSchema = extractionSchema()

	const maxRetries = 3
	const maxRateLimitRetries = 5
	rateLimitCount := 0
	var retryHint string
	for attempt := 1; attempt <= maxRetries; attempt++ {
		if attempt > 1 {
			log.Printf("リトライ %d/%d...", attempt, maxRetries)
			time.Sleep(2 * time.Second)
		}
		log.Printf("Gemini 呼び出し中 (試行 %d/%d)...", attempt, maxRetries)

		prompt := extractionPrompt
		if retryHint != "" {
			prompt += "\n\n【前回の問題点】\n" + retryHint
		}

		resp, err := model.GenerateContent(ctx,
			genai.Text(prompt),
			genai.Blob{MIMEType: "application/pdf", Data: pdfData},
		)
		if err != nil {
			if isRateLimitError(err) {
				rateLimitCount++
				if rateLimitCount > maxRateLimitRetries {
					return nil, fmt.Errorf("レートリミットが %d 回連続しました", rateLimitCount)
				}
				log.Printf("レートリミット検出 (%d 回目)、10秒待機...", rateLimitCount)
				time.Sleep(10 * time.Second)
			}
			log.Printf("API エラー (試行 %d): %v", attempt, err)
			continue
		}

		if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
			log.Printf("空レスポンス (試行 %d)", attempt)
			continue
		}

		var raw strings.Builder
		for _, part := range resp.Candidates[0].Content.Parts {
			if txt, ok := part.(genai.Text); ok {
				raw.WriteString(string(txt))
			}
		}

		log.Printf("受信: %d bytes", raw.Len())

		var extracted ExtractedData
		if err := json.Unmarshal([]byte(raw.String()), &extracted); err != nil {
			log.Printf("JSON パース失敗 (試行 %d): %v", attempt, err)
			continue
		}
		if len(extracted.Tables) == 0 {
			log.Printf("テーブルが抽出されませんでした (試行 %d)", attempt)
			continue
		}

		// validFrom が空のテーブルがあれば次のリトライで Gemini に伝える
		var missingDates []string
		for _, t := range extracted.Tables {
			if t.SpecificFrom == "" && t.ValidFrom == "" {
				missingDates = append(missingDates, t.StationName)
			}
		}
		if len(missingDates) > 0 {
			retryHint = fmt.Sprintf("以下の駅で validFrom が空です: %v\nPDFのタイトルや見出しから運行期間（例: 4月7日〜7月29日）を必ず抽出し validFrom/validTo に設定してください。", missingDates)
			log.Printf("validFrom 不足 (%v)、リトライします...", missingDates)
			continue
		}

		log.Printf("抽出成功: %d テーブル", len(extracted.Tables))
		return &extracted, nil
	}

	return nil, fmt.Errorf("全ての試行が失敗しました (%d回)", maxRetries)
}

func isRateLimitError(err error) bool {
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "429") ||
		strings.Contains(msg, "rate limit") ||
		strings.Contains(msg, "quota exceeded")
}
