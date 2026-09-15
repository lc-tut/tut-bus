# extractor/geo_extract.py

座標ベース（LLM不要）のスクールバス時刻表PDF抽出器。PDFの内部テキストレイヤーから
各単語の座標を直接読み取り、表を再構成する。詳細な設計・検証根拠は
[`docs/timetable-gen-geo-extractor-plan.md`](../../../../../docs/timetable-gen-geo-extractor-plan.md)
と [`docs/ocr-extraction-verification-report.md`](../../../../../docs/ocr-extraction-verification-report.md)
を参照。

## 単体での実行方法

```sh
cd apps/api/tools/timetable-gen
python3 -m venv .venv          # 任意。requirements.txt を使うなら推奨
source .venv/bin/activate
pip install -r extractor/requirements.txt

python3 extractor/geo_extract.py downloaded/260407.pdf
```

標準出力に `types.go` の `ExtractedData` と同じ構造の JSON を出力する
（`{"tables": [...], "warnings": [...]}`。`warnings` は Go 側の
`ExtractGeo()` が異常検知に使う拡張フィールドで、`ExtractedData` には存在しない
ため `json.Unmarshal` 時には無視される）。

エラー時（PDF が壊れている等）は stderr にメッセージを出し、非ゼロで終了する。

## 依存

- `pdfplumber`（MIT license）のみ。**PyMuPDF (`fitz`) は使わない** — AGPL のため
  （このリポジトリに LICENSE ファイルが無く、AGPL の感染性を持ち込みたくない）。

## Go 側からの呼び出し

`geo_extractor.go` の `ExtractGeo()` が `python3 extractor/geo_extract.py <pdf>`
をサブプロセスとして実行し、stdout の JSON を `ExtractedData` にデコードする。
`--extractor=geo` フラグで有効化する（デフォルトは `gemini` のまま）。
