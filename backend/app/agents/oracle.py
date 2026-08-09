from app.utils.timer import timed

@timed
def oracle_node(state):

    ranked = []

    for drug in state["shield"]:

        score = 80

        if drug["safety"]["failed_trial"]:

            score -= 30

        if drug["safety"]["black_box_warning"]:

            score -= 20

        # Real ClinicalTrials.gov signal (works even when FAERS has no
        # cached entry for this drug/disease, which is always true for
        # live-discovered candidates). A drug with at least one real
        # terminated/withdrawn/suspended trial for this condition gets
        # docked -- transparent, inspectable rule, not a black-box score.
        ct_signal = drug["safety"].get("clinical_trials", {})

        if ct_signal.get("concerning_trial_count", 0) > 0:

            score -= 15

        score = max(0, min(100, score))

        ranked.append({

            "drug": drug["drug"],

            "protein": drug["protein"],

            "score": score,

            "source": drug.get("source", "chembl_cache"),

            "nct_ids": drug.get("nct_ids"),

            "phase": drug.get("phase"),

        })

    ranked.sort(

        key=lambda x: x["score"],

        reverse=True

    )

    return {

        "oracle": ranked

    }