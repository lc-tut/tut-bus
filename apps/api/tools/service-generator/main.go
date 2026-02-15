package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// ServiceData は生成されるJSONの構造を表します
type ServiceData struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	From            ServiceStopRef   `json:"from"`
	To              ServiceStopRef   `json:"to"`
	Direction       string           `json:"direction"`
	ValidityPeriods []ValidityPeriod `json:"validityPeriods"`
	Segments        []ServiceSegment `json:"segments"`
}

type ServiceStopRef struct {
	StopID      int    `json:"stopId"`
	DisplayName string `json:"displayName"`
}

type ValidityPeriod struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type ServiceSegment struct {
	SegmentType string           `json:"segmentType"`
	Condition   SegmentCondition `json:"condition"`
	Times       []TimePair       `json:"times,omitempty"`
	StartTime   string           `json:"startTime,omitempty"`
	EndTime     string           `json:"endTime,omitempty"`
	Interval    *Interval        `json:"intervalRange,omitempty"`
	Note        string           `json:"note,omitempty"`
}

type SegmentCondition struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type TimePair struct {
	Departure string `json:"departure"`
	Arrival   string `json:"arrival"`
}

type Interval struct {
	Min int `json:"min"`
	Max int `json:"max"`
}

const promptTemplate = `
あなたはバスの時刻表PDFを解析して、JSON形式に変換するアシスタントです。

PDFには複数のルート（八王子みなみ野駅⇔キャンパス、八王子駅南口⇔キャンパス など）が含まれている場合があります。
各ルート・各方向（往路・復路）ごとに個別のJSONオブジェクトを生成し、配列形式で返してください。

以下の形式でJSON配列を生成してください：

[
  {
    "id": "route-id-1",
    "name": "ルート名（例：八王子みなみ野駅 → 大学 (土曜日)）",
    "from": {
      "stopId": 出発停留所ID（数値、例: 1=八王子駅, 2=八王子みなみ野駅, 3=大学（八王子駅方面）, 4=大学(学生会館方面), 5=大学（みなみ野駅方面）, 6=学生会館）,
      "displayName": "出発停留所名"
    },
    "to": {
      "stopId": 到着停留所ID（数値）,
      "displayName": "到着停留所名"
    },
    "direction": "inbound または outbound（大学行きはinbound、大学発はoutbound）",
    "validityPeriods": [
      { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }
    ],
    "segments": [
      {
        "segmentType": "fixed",
        "condition": {
          "type": "dayType",
          "value": "weekday, saturday, sunday, holiday のいずれか"
        },
        "times": [
          { "departure": "HH:MM", "arrival": "HH:MM" }
        ]
      }
    ]
  }
]

重要な注意事項：
1. 時刻は必ず "HH:MM" 形式（24時間表記、ゼロパディング）
2. 日付は "YYYY-MM-DD" 形式。toが不明な場合は十分に未来の日付（例："2099-12-31"）を設定
3. IDはケバブケース（例：hachioji-minamino-to-campus-saturday）
4. segmentTypeは "fixed"（固定時刻）または "shuttle"（シャトル便）
5. directionは "inbound"（大学行き）または "outbound"（大学発）
6. 往路と復路は別々のオブジェクトとして生成
7. JSON以外の説明文は含めないでください。純粋なJSON配列のみを出力してください
8. マークダウンのコードブロックは使用しないでください

PDFの時刻表から情報を抽出し、上記の形式に従ってJSON配列を生成してください。
`

func main() {
	// コマンドライン引数の定義
	pdfPath := flag.String("pdf", "", "PDFファイルのパス")
	outputDir := flag.String("output", "../../data/services/generated", "出力ディレクトリ（デフォルト: generated/に出力）")
	apiKey := flag.String("api-key", os.Getenv("GEMINI_API_KEY"), "Gemini API Key")
	flag.Parse()

	if *pdfPath == "" {
		log.Fatal("PDFファイルのパスを指定してください: --pdf path/to/file.pdf")
	}

	if *apiKey == "" {
		log.Fatal("Gemini API Keyを設定してください: GEMINI_API_KEY環境変数または --api-key フラグ")
	}

	// PDFファイルの読み込み
	pdfData, err := os.ReadFile(*pdfPath)
	if err != nil {
		log.Fatalf("PDFファイルの読み込みに失敗: %v", err)
	}

	// Gemini APIクライアントの初期化
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(*apiKey))
	if err != nil {
		log.Fatalf("Gemini APIクライアントの初期化に失敗: %v", err)
	}
	defer client.Close()

	// モデルの選択とJSON形式での出力を指定
	model := client.GenerativeModel("gemini-2.0-flash")
	model.ResponseMIMEType = "application/json"

	// PDFをBase64エンコードして送信
	prompt := genai.Text(promptTemplate)
	pdfPart := genai.Blob{
		MIMEType: "application/pdf",
		Data:     pdfData,
	}

	resp, err := model.GenerateContent(ctx, prompt, pdfPart)
	if err != nil {
		log.Fatalf("Gemini APIの呼び出しに失敗: %v", err)
	}

	// レスポンスの取得
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		log.Fatal("APIから有効なレスポンスが返されませんでした")
	}

	// JSONテキストの抽出
	var jsonText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			jsonText += string(txt)
		}
	}

	// マークダウンのコードブロックを削除
	jsonText = strings.TrimSpace(jsonText)
	jsonText = strings.TrimPrefix(jsonText, "```json")
	jsonText = strings.TrimPrefix(jsonText, "```")
	jsonText = strings.TrimSuffix(jsonText, "```")
	jsonText = strings.TrimSpace(jsonText)

	// 配列形式の場合は最初の要素を取得
	var serviceData ServiceData
	if strings.HasPrefix(jsonText, "[") {
		// 配列形式で返ってきた場合
		var serviceDataArray []ServiceData
		if err := json.Unmarshal([]byte(jsonText), &serviceDataArray); err != nil {
			log.Fatalf("生成されたJSONのパースに失敗: %v\nJSON: %s", err, jsonText)
		}
		if len(serviceDataArray) == 0 {
			log.Fatal("生成されたJSON配列が空です")
		}

		// 複数のサービスが生成された場合は全て保存
		for i, data := range serviceDataArray {
			if err := validateServiceData(&data); err != nil {
				fmt.Printf("⚠️  サービス %d のバリデーションエラー（スキップ）: %v\n", i+1, err)
				continue
			}

			// 整形されたJSONを生成（カスタムフォーマット）
			prettyJSON, err := formatJSON(data)
			if err != nil {
				log.Fatalf("JSONの整形に失敗: %v", err)
			}

			// ファイルに保存（generated- プレフィックスを追加）
			fileName := "generated-" + data.ID + ".json"
			outputPath := filepath.Join(*outputDir, fileName)
			if err := os.MkdirAll(*outputDir, 0755); err != nil {
				log.Fatalf("出力ディレクトリの作成に失敗: %v", err)
			}

			if err := os.WriteFile(outputPath, prettyJSON, 0644); err != nil {
				log.Fatalf("ファイルの書き込みに失敗: %v", err)
			}

			fmt.Printf("  ✓ %s\n", fileName)
		}
		fmt.Println("\n全てのファイルを生成しました！")
		fmt.Printf("出力先: %s\n", *outputDir)
		return
	}

	// 単一オブジェクトの場合
	if err := json.Unmarshal([]byte(jsonText), &serviceData); err != nil {
		log.Fatalf("生成されたJSONのパースに失敗: %v\nJSON: %s", err, jsonText)
	}

	// バリデーション
	if err := validateServiceData(&serviceData); err != nil {
		log.Fatalf("バリデーションエラー: %v", err)
	}

	// 整形されたJSONを生成（カスタムフォーマット）
	prettyJSON, err := formatJSON(serviceData)
	if err != nil {
		log.Fatalf("JSONの整形に失敗: %v", err)
	}

	// ファイルに保存（generated- プレフィックスを追加）
	fileName := "generated-" + serviceData.ID + ".json"
	outputPath := filepath.Join(*outputDir, fileName)
	if err := os.MkdirAll(*outputDir, 0755); err != nil {
		log.Fatalf("出力ディレクトリの作成に失敗: %v", err)
	}

	if err := os.WriteFile(outputPath, prettyJSON, 0644); err != nil {
		log.Fatalf("ファイルの書き込みに失敗: %v", err)
	}

	fmt.Printf("✅ JSONファイルを生成しました: %s\n", fileName)
}

// validateServiceData はサービスデータの妥当性を検証します
func validateServiceData(data *ServiceData) error {
	if data.ID == "" {
		return fmt.Errorf("IDが空です")
	}
	if data.Name == "" {
		return fmt.Errorf("Nameが空です")
	}
	if data.From.StopID == 0 {
		return fmt.Errorf("From.StopIDが設定されていません")
	}
	if data.To.StopID == 0 {
		return fmt.Errorf("To.StopIDが設定されていません")
	}
	if data.Direction != "inbound" && data.Direction != "outbound" {
		return fmt.Errorf("Directionは 'inbound' または 'outbound' である必要があります")
	}
	if len(data.ValidityPeriods) == 0 {
		return fmt.Errorf("ValidityPeriodsが空です")
	}
	if len(data.Segments) == 0 {
		return fmt.Errorf("Segmentsが空です")
	}

	// 時刻の形式チェック
	for i, segment := range data.Segments {
		for j, time := range segment.Times {
			if !isValidTimeFormat(time.Departure) {
				return fmt.Errorf("Segments[%d].Times[%d].Departureの形式が不正です: %s", i, j, time.Departure)
			}
			if !isValidTimeFormat(time.Arrival) {
				return fmt.Errorf("Segments[%d].Times[%d].Arrivalの形式が不正です: %s", i, j, time.Arrival)
			}
		}
	}

	return nil
}

// isValidTimeFormat は時刻が "HH:MM" 形式かチェックします
func isValidTimeFormat(timeStr string) bool {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return false
	}
	if len(parts[0]) != 2 || len(parts[1]) != 2 {
		return false
	}
	return true
}

// formatJSON はJSONを整形します（timesの時刻ペアのみ1行にまとめる）
func formatJSON(data interface{}) ([]byte, error) {
	// 通常の整形
	prettyJSON, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return nil, err
	}

	// 時刻ペア（departure/arrival）のみを1行にまとめる
	result := string(prettyJSON)

	// { "departure": "HH:MM", "arrival": "HH:MM" } のパターンを1行に
	re := regexp.MustCompile(`\{\s*\n\s*"departure":\s*"([^"]+)",\s*\n\s*"arrival":\s*"([^"]+)"\s*\n\s*\}`)
	result = re.ReplaceAllString(result, `{ "departure": "$1", "arrival": "$2" }`)

	return []byte(result), nil
}
