from typing import TypedDict


class BioMindState(TypedDict):
    disease: str

    lexis: dict
    helix: dict
    shield: dict
    oracle: list
    peer_reviews: list
    report: str

    status: dict
    timings: dict