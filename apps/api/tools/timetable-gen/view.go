package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func runView(args []string) {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: go run . view <file.json|directory>")
		os.Exit(1)
	}

	target := args[0]
	info, err := os.Stat(target)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	var files []string
	if info.IsDir() {
		entries, err := filepath.Glob(filepath.Join(target, "*.json"))
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
		files = entries
	} else {
		files = []string{target}
	}

	if len(files) == 0 {
		fmt.Println("JSONファイルが見つかりません")
		return
	}

	for i, f := range files {
		if i > 0 {
			fmt.Println()
		}
		printService(f)
	}
}

func printService(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "読み込み失敗 %s: %v\n", path, err)
		return
	}

	var svc ServiceData
	if err := json.Unmarshal(data, &svc); err != nil {
		fmt.Fprintf(os.Stderr, "パース失敗 %s: %v\n", path, err)
		return
	}

	printHeader(svc)
	totalFixed := 0
	for i, seg := range svc.Segments {
		totalFixed += printSegment(i, seg)
	}
	fmt.Printf("  合計固定時刻: %d 件\n", totalFixed)
}

func printHeader(svc ServiceData) {
	width := 64
	line := strings.Repeat("─", width)

	dirLabel := "outbound (大学発)"
	if svc.Direction == "inbound" {
		dirLabel = "inbound  (大学着)"
	}

	periods := make([]string, len(svc.ValidityPeriods))
	for i, vp := range svc.ValidityPeriods {
		if vp.From == vp.To {
			periods[i] = vp.From
		} else {
			periods[i] = vp.From + " 〜 " + vp.To
		}
	}

	fmt.Println("┌" + line + "┐")
	fmt.Printf("│ %-*s │\n", width-1, svc.ID)
	fmt.Printf("│ %-*s │\n", width-1, svc.Name)
	fmt.Printf("│ %-*s │\n", width-1, dirLabel+"  有効: "+strings.Join(periods, ", "))
	fmt.Println("└" + line + "┘")
}

func printSegment(idx int, seg ServiceSegment) int {
	cond := formatCondition(seg.Condition)

	switch seg.SegmentType {
	case "shuttle":
		interval := ""
		if seg.Interval != nil {
			if seg.Interval.Min == seg.Interval.Max {
				interval = fmt.Sprintf("%d分間隔", seg.Interval.Min)
			} else {
				interval = fmt.Sprintf("%d〜%d分間隔", seg.Interval.Min, seg.Interval.Max)
			}
		}
		note := ""
		if seg.Note != "" {
			note = "  " + seg.Note
		}
		fmt.Printf("  [シャトル] %s  %s 〜 %s  (%s)%s\n",
			cond, seg.StartTime, seg.EndTime, interval, note)
		return 0

	case "fixed":
		count := len(seg.Times)
		fmt.Printf("  [固定] %s  (%d件)\n", cond, count)
		printTimePairs(seg.Times)
		return count

	default:
		fmt.Printf("  [?] %s\n", seg.SegmentType)
		return 0
	}
}

func printTimePairs(times []TimePair) {
	const cols = 4
	for i, tp := range times {
		if i%cols == 0 {
			fmt.Print("    ")
		}
		fmt.Printf("%s→%s", tp.Departure, tp.Arrival)
		if i%cols == cols-1 || i == len(times)-1 {
			fmt.Println()
		} else {
			fmt.Print("  ")
		}
	}
}

func formatCondition(c SegmentCondition) string {
	switch c.Type {
	case "dayType":
		labels := map[string]string{
			"weekday":  "平日",
			"saturday": "土曜",
			"holiday":  "休日",
		}
		if l, ok := labels[c.Value]; ok {
			return l
		}
		return c.Value
	case "specificPeriod":
		if c.From == c.To {
			return c.From
		}
		return c.From + "〜" + c.To
	default:
		return c.Type
	}
}
