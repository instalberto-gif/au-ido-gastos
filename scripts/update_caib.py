"""Download complete official CAIB holiday calendars. No calculated/fallback dates."""
import argparse
import io
import json
import re
import sys
import unicodedata
import urllib.request
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "vacaciones" / "data"
MONTHS = dict(zip("enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split(), range(1, 13)))
MONTHS["setiembre"] = 9
MONTH_PATTERN = "|".join(MONTHS)
PDF_SOURCES = {2027: "https://www.caib.es/eboibfront/pdf/es/2026/122/1229310"}

def clean(value):
    return " ".join("".join(c for c in unicodedata.normalize("NFD", value) if not unicodedata.combining(c)).split()).lower()

def make_date(day, month, year):
    return date(year, MONTHS[clean(month)], int(day)).isoformat()

class CalendarHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows, self.headings = [], []
        self.row, self.cell, self.heading = None, None, None
    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        if tag in ("td", "th") and self.row is not None:
            self.cell = []
        if tag in ("h1", "h2", "h3", "h4"):
            self.heading = []
        if tag in ("br", "p", "div"):
            if self.cell is not None:
                self.cell.append(" ")
            if self.heading is not None:
                self.heading.append(" ")
    def handle_data(self, value):
        if self.cell is not None:
            self.cell.append(value)
        if self.heading is not None:
            self.heading.append(value)
    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.row is not None and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = None
        if tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None
        if tag in ("h1", "h2", "h3", "h4") and self.heading is not None:
            self.headings.append(" ".join("".join(self.heading).split()))
            self.heading = None
        if tag in ("p", "div") and self.cell is not None:
            self.cell.append(" ")

def parse_dates(text, year, scope):
    text = " ".join(text.split())
    matches = list(re.finditer(r"(\d{1,2})\s+(?:de\s+)?(" + MONTH_PATTERN + r")\b", text, re.I))
    return [{"date": make_date(m[1], m[2], year),
             "name": text[m.end():matches[i+1].start() if i+1 < len(matches) else len(text)].strip(" :;,.-"),
             "scope": scope} for i, m in enumerate(matches)]

def validate(rows, year):
    if len(rows) != 14 or len({h["date"] for h in rows}) != 14:
        raise ValueError("Expected 14 distinct holidays")
    if sum(h["scope"] == "general" for h in rows) != 12 or sum(h["scope"] == "palma" for h in rows) != 2:
        raise ValueError("Expected 12 general and 2 Palma holidays")
    for h in rows:
        if date.fromisoformat(h["date"]).year != year or not h["name"] or len(h["name"]) > 160:
            raise ValueError("Invalid year, date or name")
    return sorted(rows, key=lambda h: h["date"])

def parse_html(text, year):
    parser = CalendarHTML()
    parser.feed(text)
    if not re.search(r"calendario laboral.{0,130}\b" + str(year) + r"\b", clean(" ".join(parser.headings))):
        raise ValueError("Official heading does not identify requested year")
    general, local = {}, []
    for row in parser.rows:
        if len(row) < 2:
            continue
        m = re.fullmatch(r"(\d{1,2})\s+(?:de\s+)?(" + MONTH_PATTERN + r")", clean(row[0]))
        if m:
            d = make_date(m[1], m[2], year)
            general[d] = {"date": d, "name": " ".join(row[1:]).strip(), "scope": "general"}
        if clean(row[0]) == "palma":
            local = parse_dates(" ".join(row[1:]), year, "palma")
    return validate(list(general.values()) + local, year)

def parse_pdf(payload, year):
    from pypdf import PdfReader
    text = " ".join("\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(payload)).pages).split())
    if not re.search(r"calendario laboral general y local para el a[nñ]o\s+" + str(year), text, re.I):
        raise ValueError("BOIB does not identify requested year")
    general = re.search(r"1\.\s*Fiestas de [áa]mbito general de las Illes Balears\s*(.*?)2\.\s*Fiestas de [áa]mbito local", text, re.I)
    palma = re.search(r"\bPalma\b\s*(.*?)\bPetra\b", text, re.I)
    if not general or not palma:
        raise ValueError("BOIB structure changed; manual review required")
    # The general list ends before the page footer; do not import publication dates.
    general_text = re.split(r"https?://", general[1], maxsplit=1)[0]
    return validate(parse_dates(general_text, year, "general") + parse_dates(palma[1], year, "palma"), year)

def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "AU-Ido-public-holiday-calendar/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = response.read(5_000_001)
        if len(payload) > 5_000_000:
            raise ValueError("Official document exceeds size limit")
        return payload, response.headers.get_content_charset() or "utf-8"

def collect(year):
    sources = [(f"https://www.caib.es/sites/calendarilaboral/es/aao_{year}/", "html")]
    if year in PDF_SOURCES:
        sources.append((PDF_SOURCES[year], "pdf"))
    problems = []
    for source, kind in sources:
        try:
            raw, encoding = download(source)
            rows = parse_pdf(raw, year) if kind == "pdf" else parse_html(raw.decode(encoding), year)
            return {"provider": "CAIB", "year": year, "municipality": "Palma", "source": source,
                    "fetched_at": datetime.now(timezone.utc).isoformat(), "holidays": rows}
        except Exception as error:
            problems.append(f"{source}: {type(error).__name__}: {error}")
    raise ValueError("; ".join(problems))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", nargs="+", type=int)
    args = parser.parse_args()
    existing = {int(p.stem.rsplit("-", 1)[1]) for p in OUTPUT.glob("caib-palma-*.json")}
    current = date.today().year
    years = args.years or sorted(existing | {current, current+1})
    OUTPUT.mkdir(parents=True, exist_ok=True)
    success = 0
    for year in years:
        if not 2000 <= year <= 2100:
            raise ValueError("Year outside supported range")
        try:
            result = collect(year)
            target = OUTPUT / f"caib-palma-{year}.json"
            temp = target.with_suffix(".tmp")
            temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            temp.replace(target)
            success += 1
            print(f"{year}: 12 general + 2 Palma; source {result['source']}")
        except Exception as error:
            # Keep the last successfully verified copy. Never copy a different year.
            print(f"{year}: unavailable, previous verified data preserved. {error}", file=sys.stderr)
    return 0 if success else 1

if __name__ == "__main__":
    raise SystemExit(main())
