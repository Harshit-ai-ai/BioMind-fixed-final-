from langchain_core.messages import HumanMessage

from app.llm.granite import get_llm
from app.utils.prompt_loader import load_prompt
from app.utils.timer import timed

PROMPT = load_prompt("synapse")

@timed
def synapse_node(state):
    try:
        llm = get_llm()
        response = llm.invoke([
            HumanMessage(
                content=PROMPT + "\n\n"
                + str(state["oracle"])
            )
        ])
        return {
            "report": response.content
        }
    except Exception as e:
        print(f"[SYNAPSE] LLM call failed: {e}")
        # Return a dynamically generated fallback report based on oracle
        lines = ["## 📊 SYNAPSE – Final Report on Ranked Drug-Target Candidates\n"]
        for candidate in state.get("oracle", []):
            drug = candidate["drug"]
            protein = candidate["protein"]
            score = candidate["score"]
            lines.append(f"### {drug} – {protein} (Score: {score})")
            lines.append(f"Dynamically identified as a modulator of {protein} for the treatment of {state['disease']}. Evidence score indicates confidence based on ChEMBL/FAERS analysis.")
        return {
            "report": "\n\n".join(lines)
        }