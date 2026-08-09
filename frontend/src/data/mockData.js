// Mock data for ALS (Amyotrophic Lateral Sclerosis) - the golden-path demo disease
export const DEMO_DISEASE = "ALS (Amyotrophic Lateral Sclerosis)";

export const AGENTS = [
  {
    id: "lexis",
    code: "LEXIS",
    name: "Literature Scout",
    icon: "🔬",
    color: "#6366f1",
    colorDark: "#4f46e5",
    role: "Searching 36M+ PubMed papers & bioRxiv preprints",
    status: "idle", // idle | thinking | done | error
  },
  {
    id: "helix",
    code: "HELIX",
    name: "Molecular Analyst",
    icon: "🧪",
    color: "#8b5cf6",
    colorDark: "#7c3aed",
    role: "Mapping approved drugs to SOD1/TDP-43/FUS protein targets",
    status: "idle",
  },
  {
    id: "shield",
    code: "SHIELD",
    name: "Safety Screener",
    icon: "⚗️",
    color: "#06b6d4",
    colorDark: "#0891b2",
    role: "Screening toxicity profiles via FDA FAERS & ClinicalTrials.gov",
    status: "idle",
  },
  {
    id: "oracle",
    code: "ORACLE",
    name: "Evidence Synthesizer",
    icon: "📊",
    color: "#10b981",
    colorDark: "#059669",
    role: "Scoring candidates by biological plausibility & evidence strength",
    status: "idle",
  },
  {
    id: "synapse",
    code: "SYNAPSE",
    name: "Report Architect",
    icon: "📋",
    color: "#f59e0b",
    colorDark: "#d97706",
    role: "Compiling ranked hypotheses into citable research output",
    status: "idle",
  },
];

export const REASONING_STEPS = [
  // LEXIS steps
  {
    agent: "lexis",
    delay: 800,
    text: "Querying PubMed for 'ALS SOD1 TDP-43 FUS neurodegeneration pathogenesis'...",
  },
  {
    agent: "lexis",
    delay: 1600,
    text: "Retrieved 4,312 papers. Filtering for mechanistic studies with protein-target annotations...",
  },
  {
    agent: "lexis",
    delay: 2400,
    text: "Identified core pathomechanisms: mitochondrial dysfunction, protein aggregation (TDP-43), axonal transport failure, neuroinflammation (NF-κB pathway).",
  },
  {
    agent: "lexis",
    delay: 3200,
    text: "Primary targets confirmed: SOD1, TARDBP, FUS, UBQLN2, C9orf72 repeat expansion. LEXIS analysis complete. ✓",
  },
  // HELIX steps
  {
    agent: "helix",
    delay: 4000,
    text: "Loading ChEMBL 33 + DrugBank 5.1.10 — 14,312 approved small molecules...",
  },
  {
    agent: "helix",
    delay: 4800,
    text: "Running ligand-target affinity screen against SOD1 (active site Zn/Cu) and TDP-43 RRM domains...",
  },
  {
    agent: "helix",
    delay: 5600,
    text: "High-confidence hits: Masitinib (KIT/PDGFR inhibitor, phase 3 ALS trials), Riluzole (glutamate modulator, FDA-approved), Rapamycin (mTOR/autophagy activation).",
  },
  {
    agent: "helix",
    delay: 6400,
    text: "Novel repurposing candidate identified: Bosutinib (BCR-ABL/Src inhibitor) — strong TDP-43 aggregation inhibition in murine models. HELIX analysis complete. ✓",
  },
  // SHIELD steps
  {
    agent: "shield",
    delay: 7200,
    text: "Cross-referencing 4 candidates against FDA FAERS adverse event database (2004–2024)...",
  },
  {
    agent: "shield",
    delay: 8000,
    text: "Checking ClinicalTrials.gov for CNS contraindications and blood-brain barrier penetration data...",
  },
  {
    agent: "shield",
    delay: 8800,
    text: "Masitinib: acceptable CNS safety profile, confirmed BBB penetration. Bosutinib: hepatotoxicity flag (Grade 2) — noted, dose adjustment recommended.",
  },
  {
    agent: "shield",
    delay: 9600,
    text: "Rapamycin: immunosuppression risk at ALS doses, requiring careful patient stratification. SHIELD screening complete. ✓",
  },
  // ORACLE steps
  {
    agent: "oracle",
    delay: 10400,
    text: "Computing composite BioMind Evidence Score (BES) = 0.4×mechanistic + 0.35×clinical + 0.25×safety...",
  },
  {
    agent: "oracle",
    delay: 11200,
    text: "Masitinib BES: 0.91 — Phase 3 RCT data (MAST), statistically significant slowing of ALSFRS-R decline.",
  },
  {
    agent: "oracle",
    delay: 12000,
    text: "Bosutinib BES: 0.78 — strong preclinical mechanistic evidence; Phase 1/2 safety data in ALS (UMIN000015753) positive.",
  },
  {
    agent: "oracle",
    delay: 12800,
    text: "Ranking finalized. 4 candidates stratified by confidence tier. ORACLE synthesis complete. ✓",
  },
  // SYNAPSE steps
  {
    agent: "synapse",
    delay: 13600,
    text: "Compiling structured research report with 47 PubMed citations and 3 clinical trial references...",
  },
  {
    agent: "synapse",
    delay: 14400,
    text: "Generating natural-language hypothesis summaries formatted for scientific review...",
  },
  {
    agent: "synapse",
    delay: 15200,
    text: "BioMind analysis for ALS complete. Total elapsed: 28.4 seconds. 4 ranked candidates ready. ✓",
  },
];

export const RESULTS = [
  {
    rank: 1,
    drug: "Masitinib",
    originalIndication: "Mastocytosis / Pancreatic Cancer",
    mechanism: "KIT/PDGFR tyrosine kinase inhibitor → neuroinflammation suppression via mast cell modulation + direct motoneuron protection",
    score: 0.91,
    tier: "High Confidence",
    tierColor: "#10b981",
    evidence: "Phase 3 RCT (AB Science MAST trial, n=394): statistically significant slowing of ALSFRS-R functional decline at 4.5mg/kg/day. HR=0.66, p=0.003.",
    citations: 18,
    target: "KIT, PDGFR, FGFR3",
    bbp: true,
    safetyFlag: null,
    pmid: "PMC9534083",
  },
  {
    rank: 2,
    drug: "Bosutinib",
    originalIndication: "Chronic Myeloid Leukemia (CML)",
    mechanism: "BCR-ABL/Src kinase inhibitor → suppresses TDP-43 phosphorylation & aggregation, restores autophagy flux in ALS motor neurons",
    score: 0.78,
    tier: "High Confidence",
    tierColor: "#10b981",
    evidence: "Phase 1/2 ALS trial (UMIN000015753, n=25): favorable safety & preliminary neuroprotective signal. Strong murine SOD1-G93A model data (Katsuno et al., 2016).",
    citations: 12,
    target: "BCR-ABL, Src, TDP-43",
    bbp: true,
    safetyFlag: "Hepatotoxicity (Grade 2) — monitor LFTs monthly",
    pmid: "PMC5083205",
  },
  {
    rank: 3,
    drug: "Rapamycin (Sirolimus)",
    originalIndication: "Organ Transplant Rejection",
    mechanism: "mTORC1 inhibitor → autophagy activation clears TDP-43/FUS aggregates, reduces neuroinflammatory cytokine release (TNF-α, IL-6)",
    score: 0.67,
    tier: "Moderate Confidence",
    tierColor: "#f59e0b",
    evidence: "Preclinical evidence strong (SOD1-G93A mice: 12% survival extension). No ALS-specific RCT yet. Dose-limiting immunosuppression at therapeutic CNS levels.",
    citations: 9,
    target: "mTORC1, FKBP12",
    bbp: true,
    safetyFlag: "Immunosuppression — requires patient stratification",
    pmid: "PMC4203984",
  },
  {
    rank: 4,
    drug: "Riluzole (reference)",
    originalIndication: "ALS (FDA-approved 1995)",
    mechanism: "Glutamate release inhibitor → reduces excitotoxic motoneuron death. Modest disease-modifying effect validated.",
    score: 0.55,
    tier: "Established Baseline",
    tierColor: "#6366f1",
    evidence: "FDA-approved standard of care. Extends survival ~2–3 months. Included as evidence baseline for scoring calibration.",
    citations: 31,
    target: "Voltage-gated Na⁺ channels, glutamate transport",
    bbp: true,
    safetyFlag: null,
    pmid: "PMC2494672",
  },
];

// For the D3 evidence graph nodes
export const GRAPH_NODES = [
  { id: "als", label: "ALS", type: "disease", x: 400, y: 250 },
  { id: "sod1", label: "SOD1", type: "target", x: 200, y: 120 },
  { id: "tdp43", label: "TDP-43", type: "target", x: 400, y: 80 },
  { id: "fus", label: "FUS", type: "target", x: 600, y: 120 },
  { id: "mtor", label: "mTORC1", type: "target", x: 600, y: 380 },
  { id: "nfkb", label: "NF-κB", type: "pathway", x: 200, y: 380 },
  { id: "masitinib", label: "Masitinib", type: "drug", x: 100, y: 250 },
  { id: "bosutinib", label: "Bosutinib", type: "drug", x: 300, y: 450 },
  { id: "rapamycin", label: "Rapamycin", type: "drug", x: 700, y: 280 },
  { id: "riluzole", label: "Riluzole", type: "drug", x: 500, y: 450 },
];

export const GRAPH_LINKS = [
  { source: "als", target: "sod1", strength: 0.9 },
  { source: "als", target: "tdp43", strength: 0.95 },
  { source: "als", target: "fus", strength: 0.8 },
  { source: "als", target: "nfkb", strength: 0.7 },
  { source: "als", target: "mtor", strength: 0.6 },
  { source: "masitinib", target: "nfkb", strength: 0.85 },
  { source: "masitinib", target: "sod1", strength: 0.75 },
  { source: "bosutinib", target: "tdp43", strength: 0.88 },
  { source: "bosutinib", target: "sod1", strength: 0.72 },
  { source: "rapamycin", target: "mtor", strength: 0.9 },
  { source: "rapamycin", target: "tdp43", strength: 0.65 },
  { source: "riluzole", target: "als", strength: 0.55 },
];
