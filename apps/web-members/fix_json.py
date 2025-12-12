import re
import json
from pathlib import Path

def strip_code_fences(text: str) -> str:
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)
    return text.strip()

def extract_probable_json_chunks(html: str) -> list[str]:
    # 1) Prefer fenced blocks first.
    fenced = re.findall(r"```json\s*(.*?)```", html, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        return [c.strip() for c in fenced]

    # 2) Fallback. Grab bracketed arrays that look like JSON arrays.
    # This is intentionally greedy-ish. We'll repair after.
    chunks = re.findall(r"\[\s*\{.*?\}\s*\]", html, flags=re.DOTALL)
    return [c.strip() for c in chunks]

def try_parse_json(s: str):
    return json.loads(s)

def lightweight_repair(s: str) -> str:
    # Minimal repairs. Not a full JSON repair engine, but fixes common copy/paste issues.
    s = s.strip()

    # Remove trailing commas before } or ]
    s = re.sub(r",\s*([}\]])", r"\1", s)

    # Replace smart quotes with normal quotes
    s = s.replace("“", "\"").replace("”", "\"").replace("’", "'")

    # If someone pasted JSON with single quotes around keys/strings, attempt a safe-ish conversion.
    # Note. This is risky if text contains apostrophes. We only convert if it looks like Python dict style.
    if re.search(r"'\w+'\s*:", s) and '"' not in s:
        s = re.sub(r"'", "\"", s)

    return s

def normalize_to_list(obj):
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        return [obj]
    return []

def main():
    in_path = Path("outputs.html")
    out_path = Path("firms_clean.json")

    html = in_path.read_text(encoding="utf-8", errors="ignore")
    chunks = extract_probable_json_chunks(html)

    all_rows = []
    failures = []

    for i, chunk in enumerate(chunks, start=1):
        raw = strip_code_fences(chunk)
        repaired = lightweight_repair(raw)

        # Try parse. If it fails, try a slightly more aggressive bracket trim.
        try:
            parsed = try_parse_json(repaired)
            all_rows.extend(normalize_to_list(parsed))
            continue
        except Exception as e1:
            # Aggressive. Try to find the first [ and last ] and parse inside.
            try:
                start = repaired.find("[")
                end = repaired.rfind("]")
                if start != -1 and end != -1 and end > start:
                    parsed = try_parse_json(repaired[start:end+1])
                    all_rows.extend(normalize_to_list(parsed))
                    continue
            except Exception as e2:
                failures.append({"chunk_index": i, "error": str(e2)})

            failures.append({"chunk_index": i, "error": str(e1)})

    # Deduplicate by name+url if present
    seen = set()
    deduped = []
    for row in all_rows:
        if not isinstance(row, dict):
            continue
        key = (
            (row.get("name") or "").strip().lower(),
            (row.get("url") or "").strip().lower()
        )
        if key == ("", ""):
            continue
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)

    out_path.write_text(json.dumps(deduped, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Extracted rows: {len(all_rows)}")
    print(f"Deduped rows: {len(deduped)}")
    print(f"Wrote: {out_path}")
    if failures:
        print(f"Failed chunks: {len(failures)}")
        for f in failures[:10]:
            print("  ", f)

if __name__ == "__main__":
    main()
