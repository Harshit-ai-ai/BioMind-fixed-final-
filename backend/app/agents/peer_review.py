from app.llm.granite import get_llm
from app.utils.timer import timed

from langchain_core.messages import HumanMessage

import json
from json_repair import repair_json


@timed
def peer_review_node(state):

    lexis = state["lexis"]

    reviews = []

    agents = [
        "helix",
        "shield",
        "oracle",
        "synapse"
    ]

    llm = get_llm()

    for agent in agents:

        prompt = f"""
You are the peer-review component of a biomedical multi-agent system.

The primary agent Lexis produced the following analysis:

{json.dumps(lexis, indent=2)}

You are reviewing this answer from the perspective of:

{agent}

Rate the answer from 1 to 10.

A score of 9 or 10 means the answer is sufficiently complete
and scientifically well-supported.

If the score is below 9, identify what is missing or incorrect.

Return ONLY JSON:

{{
    "agent": "{agent}",
    "rating": 0,
    "feedback": ""
}}
"""

        response = llm.invoke([
            HumanMessage(content=prompt)
        ])

        repaired = repair_json(response.content)

        review = json.loads(repaired)

        reviews.append(review)

    print("\n========== PEER REVIEWS ==========")

    for review in reviews:
        print(
            f"{review['agent']}: "
            f"{review['rating']}/10 - "
            f"{review['feedback']}"
        )

    print("==================================\n")

    return {
        "peer_reviews": reviews
    }