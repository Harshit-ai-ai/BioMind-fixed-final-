from app.services import pubmed
from app.services import chembl
from app.services import drugbank
from app.services import faers
from app.utils.timer import timed


@timed
def evidence_node(state):

    disease = state["disease"]

    literature = pubmed.get_papers(disease)
    targets = chembl.get_targets(disease)
    drugs = drugbank.get_drugs(disease)
    safety = faers.get_safety(disease)

    return {
        "evidence": {
            "literature": literature,
            "targets": targets,
            "drugbank": drugs,
            "safety": safety
        }
    }