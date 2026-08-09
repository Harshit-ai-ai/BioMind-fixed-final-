"""
End-to-end pipeline validation for the 4 supported neurodegenerative diseases.
Checks that each agent returns disease-relevant, non-empty results.
"""
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SUPPORTED = [
    "Amyotrophic Lateral Sclerosis",
    "Parkinson Disease",
    "Alzheimer Disease",
    "Huntington Disease",
    "Glioblastoma",
    "Breast Cancer",
    "Melanoma",
    "Non-Small Cell Lung Cancer",
    "Rheumatoid Arthritis",
    "Multiple Sclerosis",
    "Systemic Lupus Erythematosus",
    "Type 2 Diabetes Mellitus",
    "Heart Failure",
    "Tuberculosis",
    "COVID-19",
]
UNSUPPORTED = [
    "Fibromyalgia",
    "Common Cold",
    "Bogus Disease",
]


PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

all_passed = True


def check(label, cond, detail=""):
    global all_passed
    if cond:
        print(f"  {PASS} {label}")
    else:
        print(f"  {FAIL} {label}" + (f" — {detail}" if detail else ""))
        all_passed = False


print("\n" + "="*60)
print("  STEP 1: Input Validation — Unsupported diseases must 400")
print("="*60)
for disease in UNSUPPORTED:
    resp = client.post("/analyze", json={"disease": disease})
    check(
        f"{disease} → HTTP {resp.status_code}",
        resp.status_code == 400,
        resp.json().get("detail", "")[:100]
    )

print("\n" + "="*60)
print("  STEP 2: Cache Retrieval — Supported diseases must return data")
print("="*60)
for disease in SUPPORTED:
    resp = client.get(f"/cache/{disease}")
    check(f"{disease} → HTTP {resp.status_code}", resp.status_code == 200)
    if resp.status_code == 200:
        data = resp.json()
        check(f"  papers non-empty", len(data.get("papers", [])) > 0, str(data.get("papers")))
        check(f"  targets non-empty", len(data.get("targets", [])) > 0, str(data.get("targets")))
        check(f"  safety non-empty", len(data.get("safety", [])) > 0, str(data.get("safety")))

print("\n" + "="*60)
print("  STEP 3: Full Pipeline — Parkinson Disease (proxy for all 4)")
print("  (Running LLM calls — may take ~30s)")
print("="*60)
resp = client.post("/analyze", json={"disease": "Parkinson Disease"})
check(f"HTTP 200", resp.status_code == 200, resp.text[:200] if resp.status_code != 200 else "")
if resp.status_code == 200:
    data = resp.json()
    lexis = data.get("lexis", {})
    helix = data.get("helix", {})
    shield = data.get("shield", [])
    oracle = data.get("oracle", [])
    report = data.get("report", "")

    check("LEXIS returned proteins", len(lexis.get("proteins", [])) > 0, str(lexis))
    check("LEXIS returned pathways", len(lexis.get("pathways", [])) > 0, str(lexis))
    check("HELIX matched drugs", len(helix.get("drugs", [])) > 0, str(helix))
    check("SHIELD produced candidates", len(shield) > 0, str(shield))
    check("ORACLE ranked candidates", len(oracle) > 0, str(oracle))
    check("SYNAPSE produced report", len(report) > 100, f"report length={len(report)}")

    print("\n  --- ORACLE output ---")
    for c in oracle:
        print(f"    {c['drug']} (targets {c['protein']}) — score {c['score']}")
    print("\n  --- SYNAPSE report excerpt ---")
    print("  " + report[:500].replace("\n", "\n  "))

print("\n" + "="*60)
result = f"\033[92mALL CHECKS PASSED\033[0m" if all_passed else f"\033[91mSOME CHECKS FAILED\033[0m"
print(f"  Result: {result}")
print("="*60 + "\n")
sys.exit(0 if all_passed else 1)
