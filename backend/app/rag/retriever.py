from pathlib import Path

from langchain_community.vectorstores import FAISS

BASE_DIR = Path(__file__).resolve().parents[1]

# Lazy-loaded — avoids downloading the model at startup (which causes Render to crash)
_embedding_model = None

def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        _embedding_model = HuggingFaceEmbeddings(
            model_name="BAAI/bge-small-en-v1.5"
        )
    return _embedding_model

from app.utils.disease import normalize_disease


def retrieve_context(disease: str, k: int = 5):

    # normalize_disease() only resolves the ~46 curated diseases and
    # returns None for anything else (e.g. "Typhoid"). Previously that
    # None was passed straight into a Path join below, which raises
    # TypeError ("unsupported operand type(s) for /: 'PosixPath' and
    # 'NoneType'") and crashes the whole /analyze pipeline before HELIX's
    # ClinicalTrials.gov live-discovery fallback ever runs. Fall back to
    # the raw disease name for anything uncurated so we can still check
    # for a matching vectorstore dir, and -- when there isn't one --
    # cleanly hit the live PubMed fallback below instead of crashing.
    disease_name = normalize_disease(disease) or disease.strip()

    vector_dir = BASE_DIR / "vectorstore" / disease_name

    if not vector_dir.exists():
        from app.services import pubmed
        papers = pubmed.get_papers(disease)
        if papers:
            return "\n\n".join(
                [f"Title: {p.get('title', '')}\nAbstract: {p.get('abstract', '')}" for p in papers[:k]]
            )
        return f"Research literature for {disease} involving key protein targets and biological pathways."

    db = FAISS.load_local(
        str(vector_dir),
        _get_embedding_model(),
        allow_dangerous_deserialization=True,
    )

    docs = db.similarity_search(
        f"{disease_name} pathways proteins receptors genes molecular mechanism drug targets",
        k=k,
    )

    return "\n\n".join(
        doc.page_content
        for doc in docs
    )