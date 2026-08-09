import json
from json_repair import repair_json

from langchain_core.messages import HumanMessage

from app.llm.granite import get_llm
from app.rag.retriever import retrieve_context
from app.utils.timer import timed


@timed
def reviewer_node(state):

    disease = state["disease"]

    lexis = state["lexis"]

    context = retrieve_context(disease)

    llm = get_llm()

    response = llm.invoke([
        HumanMessage(
            content=f"""
You are a biomedical peer reviewer.

Disease:
{disease}

INITIAL LEXIS ANALYSIS:
{json.dumps(lexis, indent=2)}

BIOMEDICAL EVIDENCE:
{context}

Evaluate the Lexis analysis.

Give a score from 0 to 10 based on:

1. Biological correctness
2. Evidence support
3. Completeness
4. Relevance to the disease
5. Hallucination risk

If the score is below 9, explicitly explain what Lexis should add,
remove, or correct.

Return ONLY valid JSON:
s
{{
    "score": 0,
    "strengths": [],
    "missing_information": [],
    "corrections": [],
    "recommendations_to_lexis": []
}}
"""
        )
    ])

    repaired = repair_json(response.content)

    return {
        "review": json.loads(repaired)
    }