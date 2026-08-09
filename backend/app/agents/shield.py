from app.services import faers
from app.services import clinicaltrials
from app.utils.timer import timed

@timed
def shield_node(state):

    print("STATE:", state)
    print("HELIX:", state.get("helix"))

    disease = state["disease"]

    safety = faers.get_safety(disease)

    lookup = {
        x["drug"]: x
        for x in safety
    }

    output = []

    for drug in state["helix"]["drugs"]:

        safety_data = lookup.get(drug["drug"], {
            "drug": drug["drug"],
            "black_box_warning": False,
            "failed_trial": False
        })

        # Live, verified evidence from ClinicalTrials.gov (NIH/NLM's own
        # public API -- app/services/clinicaltrials.py). This runs for
        # EVERY candidate, curated or live-discovered, so a drug that was
        # terminated for safety reasons shows up even when FAERS has no
        # cached record for it (true for anything outside the curated
        # disease list).
        trials = clinicaltrials.get_trials(drug["drug"], disease)

        safety_data = {
            **safety_data,
            "clinical_trials": clinicaltrials.summarize_safety_signal(trials),
        }

        output.append({
            **drug,
            "safety": safety_data
        })

    return {
        "shield": output
    }