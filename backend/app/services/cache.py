from pathlib import Path
import json


from app.utils.disease import normalize_disease

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


def load_json(folder: str, filename: str):
    normalized = normalize_disease(filename)
    path = CACHE_DIR / folder / f"{normalized}.json"

    if not path.exists():
        raise FileNotFoundError(
            f"Cache not found: {path}"
        )

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)