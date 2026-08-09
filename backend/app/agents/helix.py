from app.services import chembl
from app.services import clinicaltrials
from app.utils.timer import timed


SYNONYMS = {
    "ace2": ["sars-cov-2 receptor-binding domain", "rbd", "spike protein", "sars-cov-2 spike", "angiotensin-converting enzyme 2", "sars-cov-2 receptor"],
    "il-6r": ["il-6", "interleukin-6", "cytokine storm", "interleukin-6 receptor"],
    "tmprss2": ["transmembrane protease serine 2", "coronavirus-entry network"],
}


def _protein_matches(cache_protein: str, llm_proteins: list) -> bool:
    """
    Fuzzy case-insensitive match between a ChEMBL cache protein name
    and the list of proteins extracted by LEXIS.

    Strategy (in order):
    1. Exact match (case-insensitive)
    2. Cache protein is a substring of any LLM protein name (e.g. "ACE2" in "ACE2 receptor")
    3. Any LLM protein name is a substring of the cache protein
    4. Synonym / interactor matching for complex biological terms
    5. Any word ≥ 4 chars in the cache protein appears in any LLM protein name
    """
    cache_lower = cache_protein.strip().lower().replace("-", "").replace(" ", "")
    for p in llm_proteins:
        p_lower = p.strip().lower().replace("-", "").replace(" ", "")
        if cache_lower == p_lower:
            return True
        if cache_lower in p_lower or p_lower in cache_lower:
            return True

    # Synonym/interactor matching
    cache_clean = cache_protein.lower().strip()
    for syn_key, syn_list in SYNONYMS.items():
        if cache_clean == syn_key or syn_key in cache_clean:
            for p in llm_proteins:
                p_lower = p.lower()
                if any(syn in p_lower for syn in syn_list):
                    return True

    # word-level fallback
    cache_words = [w.lower() for w in cache_protein.split() if len(w) >= 4]
    for p in llm_proteins:
        p_lower = p.lower()
        if any(w in p_lower for w in cache_words):
            return True
    return False


@timed
def helix_node(state):

    disease = state["disease"]
    proteins = state["lexis"]["proteins"]

    print("LLM proteins:")
    print(proteins)

    mappings = chembl.get_targets(disease)

    print("CHEMBL mappings:")
    print(mappings)

    drugs = []
    seen = set()

    for mapping in mappings:
        if mapping["drug"] not in seen and _protein_matches(mapping["protein"], proteins):
            drugs.append(mapping)
            seen.add(mapping["drug"])

    print("Matched drugs:")
    print(drugs)

    # Fallback: if no proteins matched, use ALL curated ChEMBL targets for this disease
    if not drugs:
        print("[HELIX] No protein matches — using all ChEMBL mappings as fallback.")
        drugs = [m for m in mappings if m["drug"] not in seen]

    source = "chembl_cache"

    # No curated ChEMBL data exists for this disease at all (anything
    # outside the ~46 hand-built cache files). Rather than return nothing,
    # ask ClinicalTrials.gov which drugs are actually being investigated
    # for this exact condition -- real candidates, each traceable to a
    # specific NCT record, instead of an empty results tab.
    if not drugs:
        print(f"[HELIX] No ChEMBL cache for '{disease}' — querying ClinicalTrials.gov live.")
        drugs = clinicaltrials.discover_drug_candidates(disease, proteins)
        source = "clinicaltrials_live"
        print(f"[HELIX] ClinicalTrials.gov discovery returned {len(drugs)} candidate(s).")

    return {
        "helix": {
            "drugs": drugs,
            "source": source,
        }
    }