import datetime
import time
import requests
from typing import List, Dict

# Configuration – can be overridden via env vars if needed
DEFAULT_DAYS_BACK = 90  # look back this many days from today
MAX_PAGES = 5  # each page returns up to 100 records; cap to avoid huge pulls
RATE_LIMIT_SECONDS = 0.5  # polite pause between API calls


def _build_interval(days_back: int) -> str:
    """Return an interval string ``YYYY-MM-DD/YYYY-MM-DD`` for the API.
    The end date is today (UTC), the start date is ``days_back`` days ago.
    """
    today = datetime.date.today()
    start = today - datetime.timedelta(days=days_back)
    return f"{start.isoformat()}/{today.isoformat()}"


def _fetch_page(server: str, interval: str, cursor: int) -> List[Dict]:
    """Fetch a single page from the bioRxiv/medRxiv API.
    Returns a list of paper dicts (as returned by the API). On error returns empty list.
    """
    url = f"https://api.biorxiv.org/details/{server}/{interval}/{cursor}/json"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # The API returns a top‑level key "collection" which holds the list of records.
        return data.get("collection", [])
    except Exception as e:
        # In production we would log this; here we just return empty.
        print(f"[preprint] error fetching {url}: {e}")
        return []


def _matches_disease(paper: Dict, disease: str) -> bool:
    """Simple case‑insensitive substring match against title or abstract.
    ``disease`` may contain spaces; we lower‑case both sides.
    """
    term = disease.lower()
    title = paper.get("title", "").lower()
    abstract = paper.get("abstract", "").lower()
    return term in title or term in abstract


def _map_to_common_schema(paper: Dict) -> Dict:
    """Map the raw API dict to the schema used by the PubMed service.
    Only the fields required downstream are populated.
    """
    return {
        "title": paper.get("title", ""),
        "abstract": paper.get("abstract", ""),
        "authors": paper.get("authors", []),
        "doi": paper.get("doi", ""),
        "id": paper.get("doi", ""),
        "year": paper.get("date", "").split("-")[0] if paper.get("date") else "",
        "source": paper.get("server", ""),
        "peer_reviewed": False,
    }


from app.services.cache import load_json, CACHE_DIR
from app.utils.disease import normalize_disease
import json

def get_papers(disease: str, days_back: int = DEFAULT_DAYS_BACK) -> List[Dict]:
    """Public entry point used by the API route.
    Retrieves recent bioRxiv and medRxiv papers, filters by ``disease`` and
    returns them in the same dict shape as the PubMed service.
    """
    normalized = normalize_disease(disease)
    try:
        return load_json("preprint", normalized)
    except FileNotFoundError:
        pass

    interval = _build_interval(days_back)
    results: List[Dict] = []
    for server in ["biorxiv", "medrxiv"]:
        cursor = 0
        for _page in range(MAX_PAGES):
            page_items = _fetch_page(server, interval, cursor)
            if not page_items:
                break
            for paper in page_items:
                if _matches_disease(paper, disease):
                    results.append(_map_to_common_schema(paper))
            cursor += 100
            time.sleep(RATE_LIMIT_SECONDS)

    try:
        cache_path = CACHE_DIR / "preprint" / f"{normalized}.json"
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
    except Exception as e:
        print(f"[preprint] failed to write cache: {e}")

    return results
