import json
import re
from json_repair import repair_json

from langchain_core.messages import HumanMessage, SystemMessage

from app.llm.granite import get_llm
from app.rag.retriever import retrieve_context
from app.utils.prompt_loader import load_prompt
from app.utils.timer import timed

PROMPT = load_prompt("lexis")


@timed
def lexis_node(state):

    disease = state["disease"]

    print("Disease received:", state["disease"])

    context = retrieve_context(disease)

    llm = get_llm()

    raw = ""
    try:
        response = llm.invoke([
            SystemMessage(
                content="You are a strict database API that returns ONLY JSON. Do not write any thoughts, explanations, introduction, markdown wrapper (like ```json), or trailing text. Your response must start with '{' and end with '}' and contain only valid JSON."
            ),
            HumanMessage(
                content=f"""
{PROMPT}

Disease:

{disease}

Relevant biomedical literature:

{context}
"""
            )
        ])

        print("\n========== LLM RESPONSE ==========")
        print(response.content)
        print("==================================\n")
        raw = response.content
    except Exception as e:
        print(f"[LEXIS] LLM call failed: {e}")
        raw = ""

    # Try to extract a JSON object if the model returned chain-of-thought
    json_match = re.search(r'\{[\s\S]*\}', raw)
    if json_match:
        raw = json_match.group(0)

    repaired = repair_json(raw)
    try:
        result = json.loads(repaired)
        if isinstance(result, dict) and "pathways" in result and "proteins" in result:
            return {"lexis": result}
    except Exception:
        pass

    # Fallback: disease-specific curated defaults so the pipeline doesn't crash
    DISEASE_DEFAULTS = {
        "COVID-19": {
            "pathways": ["viral entry via ACE2", "cytokine storm", "coagulation cascade", "TMPRSS2-mediated priming"],
            "proteins": ["ACE2", "TMPRSS2", "IL-6", "IL-6R", "SARS-CoV-2 spike protein"],
            "reasoning": "Fallback defaults for COVID-19 based on curated knowledge."
        },
        "ALS": {
            "pathways": ["protein aggregation", "mitochondrial dysfunction", "neuroinflammation"],
            "proteins": ["SOD1", "TDP-43", "FUS", "UBQLN2"],
            "reasoning": "Fallback defaults for ALS."
        },
        "Parkinson's Disease": {
            "pathways": ["dopaminergic pathway", "alpha-synuclein aggregation", "mitochondrial dysfunction"],
            "proteins": ["Alpha-synuclein", "LRRK2", "Parkin", "PINK1", "DJ-1"],
            "reasoning": "Fallback defaults for Parkinson's Disease."
        },
        "Alzheimer's Disease": {
            "pathways": ["amyloid cascade", "tau hyperphosphorylation", "neuroinflammation"],
            "proteins": ["APP", "BACE1", "Tau", "APOE", "Presenilin-1"],
            "reasoning": "Fallback defaults for Alzheimer's Disease."
        },
    }
    default = DISEASE_DEFAULTS.get(disease, {
        "pathways": ["disease-related pathway"],
        "proteins": ["disease-related protein"],
        "reasoning": f"LLM response could not be parsed for {disease}. Using minimal defaults."
    })
    print(f"[LEXIS] WARNING: Using curated defaults for {disease} due to malformed LLM response.")
    return {"lexis": default}