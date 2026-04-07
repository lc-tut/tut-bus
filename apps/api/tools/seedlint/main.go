// seedlint は seeds SQL ファイルの安全性を検証するツールです。
//
// PostgreSQL パーサー（pg_query_go）を使い、正規表現ではなく
// SQL の AST（構文木）レベルで以下をチェックします:
//
//   - safe モード: TRUNCATE/DELETE/UPDATE/DROP 禁止、INSERT は ON CONFLICT DO NOTHING 必須
//   - syntax モード: SQL 構文チェックのみ
//
// Usage:
//
//	seedlint <safe|syntax> <dir> [dir...]
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	pg_query "github.com/pganalyze/pg_query_go/v6"
	_ "github.com/wasilibs/go-pgquery"
)

// byteOffsetToLine はバイトオフセットから行番号（1-based）を返す
func byteOffsetToLine(content string, offset int) int {
	if offset <= 0 || offset > len(content) {
		return 1
	}
	return strings.Count(content[:offset], "\n") + 1
}

// lintFile は1つのSQLファイルを検証し、エラー数を返す
func lintFile(file string, mode string) int {
	errors := 0

	content, err := os.ReadFile(file)
	if err != nil {
		fmt.Fprintf(os.Stderr, "::error file=%s::ファイル読み込みエラー: %v\n", file, err)
		return 1
	}

	sql := string(content)

	// SQL構文チェック
	result, err := pg_query.Parse(sql)
	if err != nil {
		fmt.Fprintf(os.Stderr, "::error file=%s::SQL構文エラー: %v\n", file, err)
		return 1
	}

	if mode != "safe" {
		// syntax モードは構文チェックのみ
		return 0
	}

	for _, rawStmt := range result.Stmts {
		line := byteOffsetToLine(sql, int(rawStmt.StmtLocation))
		node := rawStmt.Stmt

		// TRUNCATE 禁止
		if node.GetTruncateStmt() != nil {
			fmt.Fprintf(os.Stderr, "::error file=%s,line=%d::TRUNCATE は禁止です — 既存データが全て削除されます\n", file, line)
			errors++
		}

		// DELETE 禁止
		if node.GetDeleteStmt() != nil {
			fmt.Fprintf(os.Stderr, "::error file=%s,line=%d::DELETE は禁止です — 運用中のデータが削除されます\n", file, line)
			errors++
		}

		// UPDATE 禁止
		if node.GetUpdateStmt() != nil {
			fmt.Fprintf(os.Stderr, "::error file=%s,line=%d::UPDATE は禁止です — 管理画面で編集した内容が上書きされます\n", file, line)
			errors++
		}

		// DROP 禁止
		if node.GetDropStmt() != nil {
			fmt.Fprintf(os.Stderr, "::error file=%s,line=%d::DROP は禁止です — テーブルやインデックスが削除されます\n", file, line)
			errors++
		}

		// INSERT は ON CONFLICT DO NOTHING 必須
		if insert := node.GetInsertStmt(); insert != nil {
			if insert.OnConflictClause == nil {
				fmt.Fprintf(os.Stderr, "::error file=%s,line=%d::INSERT には ON CONFLICT DO NOTHING が必要です — 冪等性を担保するため\n", file, line)
				errors++
			} else if insert.OnConflictClause.Action != pg_query.OnConflictAction_ONCONFLICT_NOTHING {
				fmt.Fprintf(os.Stderr, "::error file=%s,line=%d::ON CONFLICT DO UPDATE は禁止です — 既存データが上書きされます。DO NOTHING を使用してください\n", file, line)
				errors++
			}
		}
	}

	return errors
}

func main() {
	if len(os.Args) < 3 {
		fmt.Fprintln(os.Stderr, "seedlint — seeds SQL ファイルの安全性検証ツール")
		fmt.Fprintln(os.Stderr, "")
		fmt.Fprintln(os.Stderr, "Usage: seedlint <safe|syntax> <dir> [dir...]")
		fmt.Fprintln(os.Stderr, "")
		fmt.Fprintln(os.Stderr, "Modes:")
		fmt.Fprintln(os.Stderr, "  safe    TRUNCATE/DELETE/UPDATE/DROP禁止、INSERT は ON CONFLICT DO NOTHING 必須")
		fmt.Fprintln(os.Stderr, "  syntax  SQL構文チェックのみ（development seeds向け）")
		os.Exit(2)
	}

	mode := os.Args[1]
	if mode != "safe" && mode != "syntax" {
		fmt.Fprintf(os.Stderr, "Error: モードは 'safe' または 'syntax' を指定してください（指定: %s）\n", mode)
		os.Exit(2)
	}

	dirs := os.Args[2:]
	totalErrors := 0
	totalFiles := 0

	for _, dir := range dirs {
		files, err := filepath.Glob(filepath.Join(dir, "*.sql"))
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(2)
		}

		for _, file := range files {
			totalFiles++
			totalErrors += lintFile(file, mode)
		}
	}

	if totalFiles == 0 {
		fmt.Println("⚠️  検査対象のSQLファイルが見つかりませんでした")
		return
	}

	if totalErrors > 0 {
		fmt.Fprintf(os.Stderr, "\n❌ %d 件のエラーが見つかりました（%d ファイル検査）\n", totalErrors, totalFiles)
		os.Exit(1)
	}

	fmt.Printf("✅ %d ファイルの検証に成功しました（モード: %s）\n", totalFiles, mode)
}
