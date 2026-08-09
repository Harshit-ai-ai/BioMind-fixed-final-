import json

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from app.graph.workflow import graph

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database import crud
from app.api.schemas import DiseaseRequest

from app.services import pubmed, preprint
from app.services import chembl
from app.services import drugbank
from app.services import faers
from app.services import clinicaltrials

from app.utils.disease import normalize_disease, SUPPORTED_DISEASES

router = APIRouter()


def resolve_disease_for_analysis(disease: str):
    """
    Resolve free-text input for /analyze.

    Known aliases (e.g. "flu", "t2d") still map to their canonical
    curated name, so those queries keep using the fast, pre-cached path.

    Anything NOT in the curated set is no longer rejected -- it's passed
    through (cleaned/title-cased) so the pipeline runs on it. LEXIS
    (generic-context retrieval) and HELIX (ClinicalTrials.gov condition
    discovery, see app/services/clinicaltrials.py) both have live
    fallbacks for exactly this case. /cache/{disease} below is left
    strict on purpose -- it's a debug endpoint for inspecting the
    curated cache specifically, not the live pipeline.
    """
    if not disease:
        return None

    cleaned = disease.strip()
    if not cleaned:
        return None

    canonical = normalize_disease(cleaned)
    if canonical:
        return canonical

    return cleaned.strip(".\"'").title()

@router.get("/cache/{disease}")
def test_cache(disease: str):
    normalized = normalize_disease(disease)
    if not normalized:
        raise HTTPException(
            status_code=400,
            detail=f"Disease '{disease}' is not supported. Supported diseases are: {', '.join(SUPPORTED_DISEASES)}"
        )
    return {
        "papers": pubmed.get_papers(normalized) + preprint.get_papers(normalized),
        "targets": chembl.get_targets(normalized),
        "drugs": drugbank.get_drugs(normalized),
        "safety": faers.get_safety(normalized)
    }

@router.get("/trials/{drug}")
def test_trials(drug: str, disease: str | None = None, max_studies: int = 20):
    """
    Live (cache-backed) lookup against the official ClinicalTrials.gov
    v2 API. e.g. GET /trials/Metformin?disease=ALS
    """
    trials = clinicaltrials.get_trials(drug, disease, max_studies)

    return {
        "drug": drug,
        "disease": disease,
        "trial_count": len(trials),
        "trials": trials,
        "safety_signal": clinicaltrials.summarize_safety_signal(trials),
    }


@router.get("/discover/{disease}")
def test_discovery(disease: str, max_studies: int = 100):
    """
    Live (cache-backed) discovery of drug candidates for a disease with
    no curated ChEMBL data, straight from ClinicalTrials.gov.
    e.g. GET /discover/Narcolepsy
    """
    candidates = clinicaltrials.discover_drug_candidates(disease, max_studies=max_studies)

    return {
        "disease": disease,
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


@router.get("/")
def root():
    return {
        "message": "BioMind Backend Running"
    }

@router.post("/analyze")
def analyze(request: DiseaseRequest):

    resolved_disease = resolve_disease_for_analysis(request.disease)
    if not resolved_disease:
        raise HTTPException(
            status_code=400,
            detail="Please provide a disease name."
        )

    result = graph.invoke(

        {

            "disease": resolved_disease,

            "lexis": {},

            "helix": {},

            "shield": [],

            "oracle": [],

            "peer_reviews": [],

            "report": ""

        }

    )

    return result


@router.get("/history")
def history(
    db: Session = Depends(get_db),
):
    return crud.get_reports(db)