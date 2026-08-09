"""
Live connector to the official ClinicalTrials.gov Data API (v2).

Important: this is NOT an HTML scraper. ClinicalTrials.gov (operated by
NIH/NLM) publishes a public, authentication-free REST API that returns
structured JSON directly:

    https://clinicaltrials.gov/data-api/api

Scraping the rendered website would be slower, more fragile (it breaks on
every front-end redesign), and a worse citizen of a shared public resource
than just calling the API NIH built for exactly this purpose. So that's
what this module does. "Verified government source" is satisfied by
hitting the source's own API, not by parsing its HTML.

Behavior, matching the pattern of the other app/services modules:
    1. Try the live API first (bounded timeout, automatic retry on
       429/5xx via urllib3's Retry, since requests is already a
       dependency -- no new packages needed).
    2. On any failure (offline, rate-limited, blocked by network policy,
       etc.), fall back to a cached JSON snapshot on disk, same contract
       as chembl.py / faers.py / pubmed.py.
    3. Every successful live response is written back to that cache, so
       a repeat query -- or a demo run -- doesn't need the network again.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

from app.services.cache import CACHE_DIR, load_json

BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

# NIH's API docs ask integrators to identify their client; this is not an
# API key (none is required), just good citizenship on a shared resource.
USER_AGENT = "BioMind-Research-Tool/1.0 (drug-repurposing hypothesis pipeline)"

TIMEOUT_SECONDS = 10
MAX_RETRIES = 3
CONCERNING_STATUSES = {"TERMINATED", "WITHDRAWN", "SUSPENDED"}

_session: Optional[requests.Session] = None


def _get_session() -> requests.Session:
    global _session
    if _session is not None:
        return _session

    session = requests.Session()
    session.headers.update({
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    })

    retry = Retry(
        total=MAX_RETRIES,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))

    _session = session
    return session


def _cache_path(cache_key: str) -> Path:
    return CACHE_DIR / "clinicaltrials" / f"{cache_key}.json"


def _read_cache(cache_key: str):
    try:
        return load_json("clinicaltrials", cache_key)
    except FileNotFoundError:
        return None


def _write_cache(cache_key: str, data) -> None:
    path = _cache_path(cache_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _extract_study_fields(study: dict) -> dict:
    """Pull the fields relevant to a drug-repurposing safety check out of
    the (deeply nested) v2 study record."""

    protocol = study.get("protocolSection", {})
    identification = protocol.get("identificationModule", {})
    status_module = protocol.get("statusModule", {})
    design_module = protocol.get("designModule", {})
    conditions_module = protocol.get("conditionsModule", {})
    arms_module = protocol.get("armsInterventionsModule", {})
    sponsor_module = protocol.get("sponsorCollaboratorsModule", {})

    nct_id = identification.get("nctId")

    interventions = [
        i.get("name")
        for i in arms_module.get("interventions", [])
        if i.get("name")
    ]

    return {
        "nct_id": nct_id,
        "title": identification.get("briefTitle"),
        "status": status_module.get("overallStatus"),
        "why_stopped": status_module.get("whyStopped"),
        "phase": ", ".join(design_module.get("phases", [])) or None,
        "conditions": conditions_module.get("conditions", []),
        "interventions": interventions,
        "lead_sponsor": sponsor_module.get("leadSponsor", {}).get("name"),
        "start_date": status_module.get("startDateStruct", {}).get("date"),
        "completion_date": status_module.get("completionDateStruct", {}).get("date"),
        "has_results": bool(study.get("hasResults")),
        "url": f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else None,
    }


def _query_live(drug: str, disease: Optional[str], max_studies: int) -> list:
    session = _get_session()

    params = {
        "query.intr": drug,
        "pageSize": min(max_studies, 100),
        "format": "json",
    }
    if disease:
        params["query.cond"] = disease

    response = session.get(BASE_URL, params=params, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()

    payload = response.json()
    studies = payload.get("studies", [])

    return [_extract_study_fields(s) for s in studies]


def get_trials(
    drug: str,
    disease: Optional[str] = None,
    max_studies: int = 20,
    use_cache_fallback: bool = True,
) -> list:
    """
    Return real clinical-trial records for `drug` (optionally narrowed to
    `disease`) straight from ClinicalTrials.gov.

    Tries the live official API first. On any failure, falls back to a
    cached snapshot if one exists -- offline/demo-safe, same contract as
    the other app/services modules. Returns [] if neither is available.
    """
    cache_key = f"{drug}__{disease}" if disease else drug

    try:
        trials = _query_live(drug, disease, max_studies)
        if trials:
            _write_cache(cache_key, trials)
        return trials

    except (requests.RequestException, ValueError) as exc:
        print(
            f"[clinicaltrials] live lookup failed for "
            f"drug={drug!r} disease={disease!r}: {exc}"
        )

        if use_cache_fallback:
            cached = _read_cache(cache_key)
            if cached is not None:
                print(f"[clinicaltrials] serving cached snapshot for {cache_key!r}")
                return cached

        return []


def discover_drug_candidates(
    disease: str,
    lexis_proteins: Optional[list] = None,
    max_studies: int = 100,
    max_candidates: int = 15,
) -> list:
    """
    For a disease with no curated ChEMBL mapping, ask ClinicalTrials.gov
    directly which drugs are actually being (or have been) investigated
    for that exact condition, and turn that into a candidate list.

    This is the piece that makes the frontend show real information for
    *any* disease, not just the ~46 with a hand-built ChEMBL cache file:
    instead of HELIX coming up empty, it gets real drugs, each backed by
    one or more specific NCT records.

    Returns entries shaped like the ChEMBL cache mappings
    ({"drug": ..., "protein": ...}) so they drop straight into the
    existing HELIX -> SHIELD -> ORACLE pipeline unmodified, plus extra
    provenance fields (source, nct_ids, phase, status_summary) that
    SYNAPSE / the frontend can surface so it's clear this candidate came
    from a live trial record, not a curated database.
    """
    cache_key = f"discover__{disease}"

    try:
        studies = _query_condition_live(disease, max_studies)
        candidates = _studies_to_candidates(studies, lexis_proteins, max_candidates)
        if candidates:
            _write_cache(cache_key, candidates)
        return candidates

    except (requests.RequestException, ValueError) as exc:
        print(f"[clinicaltrials] live discovery failed for disease={disease!r}: {exc}")

        cached = _read_cache(cache_key)
        if cached is not None:
            print(f"[clinicaltrials] serving cached discovery snapshot for {disease!r}")
            return cached

        return []


def _query_condition_live(disease: str, max_studies: int) -> list:
    session = _get_session()

    params = {
        "query.cond": disease,
        "pageSize": min(max_studies, 100),
        "format": "json",
    }

    response = session.get(BASE_URL, params=params, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()

    payload = response.json()
    return payload.get("studies", [])


def _studies_to_candidates(studies: list, lexis_proteins: Optional[list], max_candidates: int) -> list:
    fallback_protein = (
        lexis_proteins[0] if lexis_proteins
        else "Mechanism target not characterized (live ClinicalTrials.gov candidate)"
    )

    by_drug = {}

    for study in studies:
        protocol = study.get("protocolSection", {})
        design_module = protocol.get("designModule", {})

        # Only interventional trials assign a drug to test -- observational
        # studies (natural history, registries) have no "candidate" to offer.
        if design_module.get("studyType") != "INTERVENTIONAL":
            continue

        fields = _extract_study_fields(study)
        arms_module = protocol.get("armsInterventionsModule", {})

        drug_names = [
            i.get("name") for i in arms_module.get("interventions", [])
            if i.get("type") == "DRUG" and i.get("name")
        ]

        for name in drug_names:
            key = name.strip().lower()
            entry = by_drug.setdefault(key, {
                "drug": name.strip(),
                "protein": fallback_protein,
                "source": "clinicaltrials.gov",
                "nct_ids": [],
                "phases": set(),
                "statuses": set(),
            })
            if fields["nct_id"]:
                entry["nct_ids"].append(fields["nct_id"])
            if fields["phase"]:
                entry["phases"].add(fields["phase"])
            if fields["status"]:
                entry["statuses"].add(fields["status"])

    candidates = [
        {
            "drug": entry["drug"],
            "protein": entry["protein"],
            "source": entry["source"],
            "nct_ids": entry["nct_ids"][:5],
            "phase": ", ".join(sorted(entry["phases"])) or None,
            "status_summary": ", ".join(sorted(entry["statuses"])) or None,
        }
        for entry in by_drug.values()
    ]

    # Most-studied drugs (more trials referencing them) first, then trim to
    # a reviewable shortlist rather than dumping every intervention in the
    # registry into the pipeline.
    candidates.sort(key=lambda c: len(c["nct_ids"]), reverse=True)
    return candidates[:max_candidates]


def summarize_safety_signal(trials: list) -> dict:
    """
    Reduce a raw trial list to the small, transparent signal SHIELD needs.
    Deliberately simple and inspectable -- no opaque score, just counts
    and the specific trials behind them -- consistent with the project's
    "every claim traces to a source record" design principle.
    """
    concerning = [
        t for t in trials
        if (t.get("status") or "").upper() in CONCERNING_STATUSES
    ]

    return {
        "trial_count": len(trials),
        "concerning_trial_count": len(concerning),
        "concerning_trials": [
            {
                "nct_id": t.get("nct_id"),
                "status": t.get("status"),
                "why_stopped": t.get("why_stopped"),
                "url": t.get("url"),
            }
            for t in concerning
        ],
    }
