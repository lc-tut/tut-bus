"""Coordinate-based (LLM-free) table extractor for TUT bus timetable PDFs.

Reads word bounding boxes from the PDF's real text layer (see
docs/timetable-gen-geo-extractor-plan.md for the design). Uses pdfplumber
(MIT) rather than PyMuPDF (AGPL, unsuitable for this public repo).

Output: a JSON object on stdout shaped like Go's ExtractedData (../types.go),
plus a top-level "warnings" array that geo_extractor.go checks to decide
whether to fall back.
"""

import json
import os
import re
import sys

import pdfplumber

TIME_RE = re.compile(r"^\d{1,2}:\d{2}$")
HEADER_LABELS = {"キャンパス発", "駅発着", "駅着発", "キャンパス着", "会館発着", "会館着発"}
TILDE = "～"  # fullwidth - do not mix with halfwidth "~" (see plan 1.4)

# 学生会館's header sometimes arrives as one run-on word with no
# inter-word space (e.g. "キャンパス発会館発着キャンパス着"); split it into
# 3 virtual words proportioned by character count.
MERGED_HEADER_TRIPLES = [
    ("キャンパス発", "会館発着", "キャンパス着"),
    ("キャンパス発", "会館着発", "キャンパス着"),
]

_ZEN2HAN_DIGITS = str.maketrans("０１２３４５６７８９", "0123456789")


def _to_halfwidth_digits(s):
    return s.translate(_ZEN2HAN_DIGITS)


RE_YEAR = re.compile(r"(\d{4})年度")
# Month is optional per match because a range/list like "８月３日～７日・
# ２４日～２８日運行" only states the month once - later day numbers ("７日",
# "２４日", "２８日") must inherit the most recently seen month.
RE_DATE_PART = re.compile(r"(?:(\d{1,2})月)?(\d{1,2})日")
RE_STATION = re.compile(r"【(.+?)】")
RE_RANGE_MARK = re.compile(r"[～〜~]")


def _parse_date_parts(text):
    """Returns a list of (month, day) tuples found in text, in order, with
    each bare "N日" inheriting the most recently stated month."""
    parts = []
    current_month = None
    for m in RE_DATE_PART.finditer(text):
        month_str, day_str = m.groups()
        if month_str:
            current_month = int(month_str)
        if current_month is None:
            continue
        parts.append((current_month, int(day_str)))
    return parts


def _classify_daytype(text):
    if "土曜" in text:
        return "saturday"
    if "月" in text and "金" in text and "曜日" in text:
        return "weekday"
    if "休日" in text:
        return "holiday"
    return None


def _find_header_words(words):
    headers = [w for w in words if w["text"] in HEADER_LABELS]
    for w in words:
        for triple in MERGED_HEADER_TRIPLES:
            merged = "".join(triple)
            if w["text"] != merged:
                continue
            total_chars = len(merged)
            cx = w["x0"]
            width = w["x1"] - w["x0"]
            for part in triple:
                pw = width * len(part) / total_chars
                headers.append({
                    "text": part,
                    "x0": cx,
                    "x1": cx + pw,
                    "top": w["top"],
                    "bottom": w["bottom"],
                })
                cx += pw
            break
    return headers


def _group_into_bands(headers):
    """Group header words into rows (bands) by y-proximity - each band is one
    header line that may contain several tables side by side."""
    headers = sorted(headers, key=lambda w: w["top"])
    bands = []
    for w in headers:
        for band in bands:
            if abs(band[0]["top"] - w["top"]) < 3:
                band.append(w)
                break
        else:
            bands.append([w])
    return bands


def _split_band_into_tables(band):
    """Split one header band into groups of 3 (dep/mid/arr) using x-gaps."""
    band = sorted(band, key=lambda w: w["x0"])
    groups, cur = [], [band[0]]
    for prev, w in zip(band, band[1:]):
        if w["x0"] - prev["x1"] > 40:  # big x gap => new table
            groups.append(cur)
            cur = [w]
        else:
            cur.append(w)
    groups.append(cur)
    return [g[:3] for g in groups if len(g) >= 3]


def _extract_date_declarations(words):
    """Finds date declarations and classifies each as "regular" (has a range
    marker "～"/"〜"/"~" -> dayType + validFrom/validTo) or "specific" (no
    range marker -> specificFrom/specificTo). This is what distinguishes a
    semester timetable from a one-off event, not the "運行" suffix or any
    day-of-week label nearby (both appear on either kind of PDF).

    Returns dicts sorted by y: {y, kind, from_md, to_md}.
    """
    decls = []
    for w in words:
        text = _to_halfwidth_digits(w["text"])
        months_days = _parse_date_parts(text)
        if not months_days:
            continue
        kind = "regular" if RE_RANGE_MARK.search(text) else "specific"
        decls.append({
            "y": w["top"],
            "kind": kind,
            "from_md": months_days[0],
            "to_md": months_days[-1],
        })
    decls.sort(key=lambda d: d["y"])
    return decls


def _extract_year_declarations(words):
    decls = []
    for w in words:
        m = RE_YEAR.search(_to_halfwidth_digits(w["text"]))
        if m:
            decls.append({"y": w["top"], "year": int(m.group(1))})
    decls.sort(key=lambda d: d["y"])
    return decls


RE_FILENAME_YYMMDD = re.compile(r"^(\d{2})(\d{2})(\d{2})")


def _year_from_filename(pdf_path, expected_month):
    """Fallback year source for PDFs with no "YYYY年度" text (e.g.
    260912.pdf). Files are named "YYMMDD[...].pdf" by the university itself,
    so this isn't a guess - but only trust it if the month matches what the
    PDF's own text states, and never invent a year from nothing (PR #197).
    """
    m = RE_FILENAME_YYMMDD.match(os.path.basename(pdf_path))
    if not m:
        return None
    yy, mm, _dd = (int(g) for g in m.groups())
    if mm != expected_month:
        return None
    return 2000 + yy


def _extract_daytype_declarations(words):
    decls = []
    for w in words:
        dt = _classify_daytype(w["text"])
        if dt:
            decls.append({"y": w["top"], "dayType": dt})
    decls.sort(key=lambda d: d["y"])
    return decls


def _extract_station_labels(words):
    labels = []
    for w in words:
        m = RE_STATION.search(w["text"])
        if m:
            labels.append({"y": w["top"], "x0": w["x0"], "x1": w["x1"], "name": m.group(1)})
    labels.sort(key=lambda label: label["y"])
    return labels


def _nearest_before(decls, y, key="y"):
    """Last entry in a y-sorted list with key <= y (small tolerance for
    same-line declarations), or None."""
    result = None
    for d in decls:
        if d[key] <= y + 0.5:
            result = d
        else:
            break
    return result


def _nearest_station(labels, table_y, x0, x1):
    best = None
    for label in labels:
        if label["y"] > table_y + 0.5:
            break
        if label["x1"] <= x0 or label["x0"] >= x1:
            continue
        best = label
    return best


def _fmt_date(year, month, day):
    return f"{year:04d}-{month:02d}-{day:02d}"


def extract_tables(pdf_path):
    """Returns a list of per-table dicts with both the debug/geometry fields
    (page, header_x, header_y, y_upper, row_count, warning) and the
    ExtractedTable-contract fields (stationName, dayType, specificFrom/To,
    validFrom/To, rows).
    """
    results = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages):
            words = page.extract_words()
            page_bottom = page.height
            page_width = page.width

            headers = _find_header_words(words)
            if not headers:
                continue
            bands = _group_into_bands(headers)

            # Build the full table list first so each table's bounds can be
            # derived from every other table's position.
            tables = []
            for band in bands:
                for g in _split_band_into_tables(band):
                    header_y = g[0]["top"]
                    col_ranges = []
                    for idx, w in enumerate(g):
                        cx0 = w["x0"] - 5
                        cx1 = (g[idx + 1]["x0"] - 2) if idx + 1 < len(g) else w["x0"] + 40
                        col_ranges.append((cx0, cx1))
                    table_x0 = col_ranges[0][0]
                    table_x1 = col_ranges[-1][1]
                    tables.append({
                        "page": page_index + 1,
                        "header_x": [w["x0"] for w in g],
                        "header_y": header_y,
                        "col_ranges": col_ranges,
                        "x_range": (table_x0, table_x1),
                    })

            # Each table's y-window ends at the nearest header below it that
            # overlaps in x; its note ("備考") column ends at the nearest
            # table starting to its right. Both are nearest-neighbour
            # boundaries, never hardcoded coordinates.
            for t in tables:
                tx0, tx1 = t["x_range"]
                y_candidates = [
                    o["header_y"] for o in tables
                    if o is not t and o["header_y"] > t["header_y"]
                    and not (o["x_range"][1] <= tx0 or o["x_range"][0] >= tx1)
                ]
                t["y_upper"] = min(y_candidates) if y_candidates else page_bottom

                note_candidates = [
                    o["x_range"][0] for o in tables
                    if o is not t and o["x_range"][0] > tx1
                ]
                t["note_x_range"] = (tx1 - 8, min(note_candidates) if note_candidates else page_width)

            date_decls = _extract_date_declarations(words)
            year_decls = _extract_year_declarations(words)
            daytype_decls = _extract_daytype_declarations(words)
            station_labels = _extract_station_labels(words)

            for t in tables:
                col_words = [[], [], []]
                note_words = []
                note_x0, note_x1 = t["note_x_range"]
                for w in words:
                    wy = w["top"]
                    # Tight buffer to skip the header row - some PDFs pack
                    # the first data row as close as ~5pt below it.
                    if not (t["header_y"] + 2 < wy < t["y_upper"] - 1):
                        continue
                    text = w["text"]
                    if TIME_RE.match(text) or text == TILDE:
                        for ci, (cx0, cx1) in enumerate(t["col_ranges"]):
                            if cx0 <= w["x0"] < cx1:
                                col_words[ci].append(w)
                                break
                    elif note_x0 <= w["x0"] < note_x1:
                        note_words.append(w)

                for c in col_words:
                    c.sort(key=lambda w: w["top"])

                lens = [len(c) for c in col_words]
                warn = f"column length mismatch {lens}" if len(set(lens)) != 1 else None
                n = min(lens) if lens else 0

                rows = []
                for i in range(n):
                    dep_w, mid_w, arr_w = col_words[0][i], col_words[1][i], col_words[2][i]
                    row = [dep_w["text"], mid_w["text"], arr_w["text"]]
                    if dep_w["text"] == TILDE:
                        row_y0, row_y1 = dep_w["top"], dep_w["bottom"]
                        nearby = [
                            nw for nw in note_words
                            if row_y0 - 9 <= nw["top"] <= row_y1 + 16
                        ]
                        nearby.sort(key=lambda w: (w["top"], w["x0"]))
                        row.append("".join(w["text"] for w in nearby))
                    rows.append(row)

                station = _nearest_station(station_labels, t["header_y"], t["x_range"][0], t["x_range"][1])
                station_name = station["name"] if station else ""

                day_type = ""
                specific_from = specific_to = ""
                valid_from = valid_to = ""

                date_decl = _nearest_before(date_decls, t["header_y"])
                if date_decl is not None:
                    # PR #197: never guess a year. Falls back to the
                    # filename if no "YYYY年度" text exists (see
                    # _year_from_filename).
                    year_decl = _nearest_before(year_decls, date_decl["y"] + 0.5)
                    if year_decl is not None:
                        year = year_decl["year"]
                    else:
                        year = _year_from_filename(pdf_path, date_decl["from_md"][0])
                        if year is not None:
                            print(
                                f"注記: {os.path.basename(pdf_path)} にYYYY年度の記載が無いため、"
                                f"ファイル名から年 {year} を補完しました",
                                file=sys.stderr,
                            )
                    if year is not None:
                        from_date = _fmt_date(year, *date_decl["from_md"])
                        to_date = _fmt_date(year, *date_decl["to_md"])
                        if date_decl["kind"] == "specific":
                            specific_from, specific_to = from_date, to_date
                        else:
                            valid_from, valid_to = from_date, to_date
                            dt_decl = _nearest_before(daytype_decls, t["header_y"])
                            if dt_decl is not None:
                                day_type = dt_decl["dayType"]

                results.append({
                    "page": t["page"],
                    "header_x": t["header_x"],
                    "header_y": t["header_y"],
                    "y_upper": t["y_upper"],
                    "row_count": len(rows),
                    "warning": warn,
                    "stationName": station_name,
                    "dayType": day_type,
                    "specificFrom": specific_from,
                    "specificTo": specific_to,
                    "validFrom": valid_from,
                    "validTo": valid_to,
                    "rows": rows,
                })
    return results


def to_extracted_data(tables):
    """Converts extract_tables() output into the {"tables": [...], "warnings":
    [...]} contract shape (see types.go's ExtractedData)."""
    out_tables = []
    warnings = []
    for t in tables:
        if t["warning"]:
            warnings.append(f"{t['stationName'] or '(unknown station)'} p{t['page']}: {t['warning']}")
        out_tables.append({
            "stationName": t["stationName"],
            "dayType": t["dayType"],
            "specificFrom": t["specificFrom"],
            "specificTo": t["specificTo"],
            "validFrom": t["validFrom"],
            "validTo": t["validTo"],
            "segments": [{"type": "fixed", "rows": t["rows"]}],
        })
    if not out_tables:
        warnings.append("no tables detected")
    return {"tables": out_tables, "warnings": warnings}


def main():
    if len(sys.argv) != 2:
        print("usage: geo_extract.py <pdf_path>", file=sys.stderr)
        sys.exit(2)
    path = sys.argv[1]
    try:
        tables = extract_tables(path)
        data = to_extracted_data(tables)
    except Exception as e:  # noqa: BLE001 - surfaced to Go as a non-zero exit
        print(f"geo_extract failed on {path}: {e}", file=sys.stderr)
        sys.exit(1)
    json.dump(data, sys.stdout, ensure_ascii=False, indent=2)
    print()


if __name__ == "__main__":
    main()
