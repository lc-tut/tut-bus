package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// runValidate checks committed service JSON against the same rules the
// generator applies, so a data-only PR (which touches no Go code) still has
// something gating it.
func runValidate(args []string) {
	target := "../../data/services"
	if len(args) > 0 {
		target = args[0]
	}

	files, err := collectServiceFiles(target)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
	if len(files) == 0 {
		fmt.Fprintf(os.Stderr, "JSONファイルが見つかりません: %s\n", target)
		os.Exit(1)
	}

	failed := 0
	for _, f := range files {
		data, err := os.ReadFile(f)
		if err != nil {
			fmt.Printf("  NG %s: 読み込み失敗: %v\n", filepath.Base(f), err)
			failed++
			continue
		}

		var svc ServiceData
		if err := json.Unmarshal(data, &svc); err != nil {
			fmt.Printf("  NG %s: JSON パース失敗: %v\n", filepath.Base(f), err)
			failed++
			continue
		}

		if errs := Validate(svc); len(errs) > 0 {
			fmt.Printf("  NG %s:\n", filepath.Base(f))
			for _, e := range errs {
				fmt.Printf("       - %v\n", e)
			}
			failed++
		}
	}

	fmt.Printf("\n検証: %d 件 / 失敗 %d 件\n", len(files), failed)
	if failed > 0 {
		os.Exit(1)
	}
}

// Deliberately non-recursive: archived/ holds expired timetables whose years
// no longer pass Validate's plausible-year check.
func collectServiceFiles(target string) ([]string, error) {
	info, err := os.Stat(target)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return []string{target}, nil
	}
	return filepath.Glob(filepath.Join(target, "*.json"))
}
