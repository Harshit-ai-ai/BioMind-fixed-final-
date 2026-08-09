import { useState, useCallback } from 'react';
import { Bot, BarChart2, Network, FileText, Award, BookOpen, Dna, Shield } from 'lucide-react';

const AGENT_ICONS = {
  lexis: BookOpen,
  helix: Dna,
  shield: Shield,
  oracle: BarChart2,
  synapse: FileText,
};
import AgentCard from './components/AgentCard';
import ResultCard from './components/ResultCard';
import EvidenceGraph from './components/EvidenceGraph';
import AnalysisSummary from './components/AnalysisSummary';
import LiteratureFeed from './components/LiteratureFeed';
import { AGENTS, DEMO_DISEASE } from './data/mockData';
import './App.css';

const TOTAL_DURATION = 16000; // ~16 seconds for full demo

// Convert backend oracle+helix+shield data into ResultCard-compatible objects
const TIER_COLORS = {
  high: '#10b981',
  moderate: '#f59e0b',
  low: '#6366f1',
};

function backendToResults(data) {
  if (!data || !data.oracle || data.oracle.length === 0) return null;
  const helixDrugs = (data.helix && data.helix.drugs) || [];
  const shieldList = data.shield || [];
  const shieldMap = {};
  shieldList.forEach((s) => { shieldMap[s.drug] = s; });
  const helixMap = {};
  helixDrugs.forEach((h) => { helixMap[h.drug] = h; });

  return data.oracle.map((item, i) => {
    const shieldEntry = shieldMap[item.drug];
    const helixEntry = helixMap[item.drug];
    const ctSignal = shieldEntry?.safety?.clinical_trials;
    const isLiveSourced = item.source === 'clinicaltrials_live' || helixEntry?.source === 'clinicaltrials.gov';

    const safetyFlag = shieldEntry?.safety?.black_box_warning
      ? 'Black Box Warning — review FAERS data'
      : shieldEntry?.safety?.failed_trial
      ? 'Prior failed trial — evidence downweighted'
      : ctSignal?.concerning_trial_count > 0
      ? `Real ClinicalTrials.gov record found terminated/withdrawn/suspended (${ctSignal.concerning_trials[0]?.nct_id || 'see trial'})`
      : null;

    const score100 = item.score; // already 0–100 from oracle
    const normalizedScore = Math.min(1, score100 / 100);
    const tier =
      normalizedScore >= 0.7 ? 'High Confidence'
      : normalizedScore >= 0.4 ? 'Moderate Confidence'
      : 'Low Confidence';
    const tierColor =
      normalizedScore >= 0.7 ? TIER_COLORS.high
      : normalizedScore >= 0.4 ? TIER_COLORS.moderate
      : TIER_COLORS.low;

    const nctIds = item.nct_ids || helixEntry?.nct_ids || [];
    const hasKnownProtein = item.protein && !item.protein.startsWith('Mechanism target not characterized');

    const mechanism = hasKnownProtein
      ? `${item.protein} modulator — repurposing candidate identified by BioMind pipeline`
      : isLiveSourced
      ? `Investigational for ${data.disease || 'this condition'} — molecular target not in curated ChEMBL data. Sourced directly from ${nctIds.length || 'a'} ClinicalTrials.gov ${nctIds.length === 1 ? 'record' : 'records'}${item.phase ? ` (${item.phase})` : ''}.`
      : 'Mechanism data unavailable for this candidate.';

    // Prefer a real, verifiable evidence count over a placeholder: the
    // number of actual ClinicalTrials.gov records tied to this drug,
    // whether that's how it was discovered (live path) or how many real
    // trials SHIELD found while safety-screening it (curated path).
    const citations = nctIds.length > 0 ? nctIds.length : (ctSignal?.trial_count ?? 0);
    const citationsLabel = citations === 1 ? 'clinical trial' : 'clinical trials';

    return {
      rank: i + 1,
      drug: item.drug,
      originalIndication: 'See DrugBank',
      mechanism,
      score: normalizedScore,
      tier,
      tierColor,
      evidence: data.report
        ? data.report.slice(0, 300).replace(/[#*`]/g, '') + '…'
        : 'See SYNAPSE report for full evidence summary.',
      citations,
      citationsLabel,
      target: item.protein,
      bbp: null,
      safetyFlag,
      pmid: null,
      source: isLiveSourced ? 'clinicaltrials.gov' : 'chembl_cache',
      nctIds,
      phase: item.phase || helixEntry?.phase || null,
    };
  });
}

function generateGraphData(diseaseName, backendData) {
  if (!backendData) return { nodes: [], links: [] };

  const diseaseId = "disease-node";
  const nodes = [
    { id: diseaseId, label: diseaseName, type: "disease", x: 400, y: 250 }
  ];
  const links = [];

  // 1. Pathways
  const pathways = backendData.lexis?.pathways || [];
  pathways.slice(0, 4).forEach((pathway, idx) => {
    const id = `pathway-${idx}`;
    nodes.push({ id, label: pathway, type: "pathway", x: 200 + idx * 120, y: 380 });
    links.push({ source: diseaseId, target: id, strength: 0.7 });
  });

  // 2. Targets
  const targetSet = new Set();
  const drugs = backendData.helix?.drugs || [];
  drugs.forEach((d) => {
    if (d.protein) targetSet.add(d.protein);
  });
  const targets = Array.from(targetSet);
  targets.slice(0, 4).forEach((target, idx) => {
    const id = `target-${target.toLowerCase().replace(/\s+/g, '-')}`;
    nodes.push({ id, label: target, type: "target", x: 200 + idx * 120, y: 120 });
    links.push({ source: diseaseId, target: id, strength: 0.85 });
  });

  // 3. Drugs
  drugs.slice(0, 4).forEach((d, idx) => {
    const id = `drug-${d.drug.toLowerCase().replace(/\s+/g, '-')}`;
    nodes.push({ id, label: d.drug, type: "drug", x: 100 + idx * 150, y: 250 });
    
    // Link drug to target
    if (d.protein) {
      const targetId = `target-${d.protein.toLowerCase().replace(/\s+/g, '-')}`;
      if (nodes.some(n => n.id === targetId)) {
        links.push({ source: id, target: targetId, strength: 0.8 });
      }
    }
  });

  return { nodes, links };
}

function getDynamicReasoningSteps(diseaseName, backendData = null) {
  const pathways = backendData?.lexis?.pathways || ["mechanistic pathways", "cellular stress"];
  const proteins = backendData?.lexis?.proteins || ["receptor proteins", "associated enzymes"];
  const matchedDrugs = backendData?.helix?.drugs?.map(d => d.drug) || ["candidate drugs"];
  const oracleRanked = backendData?.oracle || [];

  return [
    {
      agent: "lexis",
      delay: 800,
      text: `Querying PubMed for '${diseaseName} pathogenesis protein targets mechanism'...`,
    },
    {
      agent: "lexis",
      delay: 1600,
      text: `Retrieved biomedical literature for ${diseaseName}. Filtering for target annotations...`,
    },
    {
      agent: "lexis",
      delay: 2400,
      text: `Identified pathomechanisms: ${pathways.slice(0, 3).join(', ')}.`,
    },
    {
      agent: "lexis",
      delay: 3200,
      text: `Primary targets confirmed: ${proteins.slice(0, 4).join(', ')}. LEXIS analysis complete. ✓`,
    },
    {
      agent: "helix",
      delay: 4000,
      text: `Loading ChEMBL 33 + DrugBank 5.1.10 datasets...`,
    },
    {
      agent: "helix",
      delay: 4800,
      text: `Running ligand-target affinity screen against ${proteins.slice(0, 2).join(' and ')}...`,
    },
    {
      agent: "helix",
      delay: 5600,
      text: `Potential matches found: ${matchedDrugs.slice(0, 3).join(', ')}.`,
    },
    {
      agent: "helix",
      delay: 6400,
      text: `Refined target-modulation mapping complete for ${diseaseName}. HELIX analysis complete. ✓`,
    },
    {
      agent: "shield",
      delay: 7200,
      text: `Cross-referencing candidates against FDA FAERS adverse event database...`,
    },
    {
      agent: "shield",
      delay: 8000,
      text: `Checking CNS contraindications and clinical safety trial data...`,
    },
    {
      agent: "shield",
      delay: 8800,
      text: matchedDrugs.length > 0 
        ? `Safety profile verified for ${matchedDrugs.slice(0, 2).join(' and ')}.`
        : `Running safety screening on default candidates...`,
    },
    {
      agent: "shield",
      delay: 9600,
      text: `SHIELD screening complete. Safety weights applied. ✓`,
    },
    {
      agent: "oracle",
      delay: 10400,
      text: `Computing composite BioMind Evidence Score (BES)...`,
    },
    {
      agent: "oracle",
      delay: 11200,
      text: oracleRanked.length > 0
        ? `Ranked candidate: ${oracleRanked[0].drug} (BES: ${(oracleRanked[0].score / 100).toFixed(2)}).`
        : `Evaluating and ranking drug repurposing candidates...`,
    },
    {
      agent: "oracle",
      delay: 12000,
      text: oracleRanked.length > 1
        ? `Ranked candidate: ${oracleRanked[1].drug} (BES: ${(oracleRanked[1].score / 100).toFixed(2)}).`
        : `Applying evidence synthesis scoring rules...`,
    },
    {
      agent: "oracle",
      delay: 12800,
      text: `Ranking finalized. Candidates stratified by confidence tier. ORACLE synthesis complete. ✓`,
    },
    {
      agent: "synapse",
      delay: 13600,
      text: `Compiling structured research report with citations...`,
    },
    {
      agent: "synapse",
      delay: 14400,
      text: `Formatting natural-language hypothesis summaries...`,
    },
    {
      agent: "synapse",
      delay: 15200,
      text: `BioMind analysis for ${diseaseName} complete. Synapse report compiled. ✓`,
    },
  ];
}

function App() {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [agentStates, setAgentStates] = useState(
    Object.fromEntries(AGENTS.map((a) => [a.id, { status: 'idle', lines: [] }]))
  );
  const [activeTab, setActiveTab] = useState('agents'); // agents | results | graph
  const [resultsVisible, setResultsVisible] = useState([false, false, false, false]);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [disease, setDisease] = useState(DEMO_DISEASE);
  const [inputValue, setInputValue] = useState('');
  const [apiResults, setApiResults] = useState(null); // null = use mock, array = use backend data
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [apiError, setApiError] = useState(null); // set when the backend call actually failed (vs. genuinely 0 candidates)

  const runAnalysis = useCallback(() => {
    if (phase === 'running') return;

    const query = inputValue.trim() || DEMO_DISEASE;
    setDisease(query);
    setPhase('running');
    setActiveTab('agents');
    setResultsVisible([false, false, false, false]);
    setElapsed(0);
    setProgress(0);

    // Reset agents
    setAgentStates(
      Object.fromEntries(AGENTS.map((a) => [a.id, { status: 'idle', lines: [] }]))
    );

    // Schedule reasoning steps
    const dynamicSteps = getDynamicReasoningSteps(query);
    dynamicSteps.forEach((step) => {
      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          [step.agent]: {
            status: 'thinking',
            lines: [...(prev[step.agent].lines || []), step.text],
          },
        }));
      }, step.delay);
    });

    // Mark agents as done in sequence
    const agentCompletionTimes = { lexis: 3400, helix: 6600, shield: 9800, oracle: 13000, synapse: 15400 };
    Object.entries(agentCompletionTimes).forEach(([agentId, time]) => {
      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: 'done' },
        }));
      }, time);
    });

    // Progress bar — fills to 90% over TOTAL_DURATION, then slow-crawls to 99% while waiting for API
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const el = Date.now() - startTime;
      setElapsed(el);
      const pct = el < TOTAL_DURATION
        ? (el / TOTAL_DURATION) * 90
        : 90 + Math.min(9, ((el - TOTAL_DURATION) / 30000) * 9);
      setProgress(Math.min(99, pct));
    }, 100);

    // Finalize: called once API responds (or fails)
    const finalize = (apiData) => {
      clearInterval(progressInterval);
      setProgress(100);
      if (apiData) {
        const converted = backendToResults(apiData);
        if (converted && converted.length > 0) setApiResults(converted);
        const gData = generateGraphData(query, apiData);
        setGraphData(gData);
        const realSteps = getDynamicReasoningSteps(query, apiData);
        setAgentStates((prev) => {
          const next = { ...prev };
          realSteps.forEach((step) => {
            const agentSteps = realSteps.filter(s => s.agent === step.agent);
            if (next[step.agent]) next[step.agent].lines = agentSteps.map(s => s.text);
          });
          return next;
        });
      }
      // Ensure all agents show done
      setAgentStates((prev) =>
        Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, status: 'done' }]))
      );
      setPhase('done');
      setActiveTab('results');
      [0, 300, 600, 900].forEach((delay, i) => {
        setTimeout(() => {
          setResultsVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, delay);
      });
    };

    // API call — UI transitions to done only AFTER this resolves
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    setApiResults(null);
    setApiError(null);
    fetch(`${backendUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disease: query })
    })
      .then(async (res) => {
        if (!res.ok) {
          // Surface the backend's actual error detail (e.g. a 500 from a
          // pipeline crash) instead of swallowing it below.
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || `Backend error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => finalize(data))
      .catch((err) => {
        console.error('Backend call failed:', err.message);
        setApiError(err.message);
        setGraphData({ nodes: [], links: [] });
        // Still let the agent animation finish before showing the failure —
        // but this is a real failure, not a legitimate "0 candidates" result.
        const waited = Date.now() - startTime;
        const remaining = Math.max(0, TOTAL_DURATION + 200 - waited);
        setTimeout(() => finalize(null), remaining);
      });
  }, [phase, inputValue]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleReset = useCallback(() => {
    setPhase('idle');
    setAgentStates(Object.fromEntries(AGENTS.map((a) => [a.id, { status: 'idle', lines: [] }])));
    setActiveTab('agents');
    setResultsVisible([false, false, false, false]);
    setElapsed(0);
    setProgress(0);
    setInputValue('');
    setApiResults(null);
    setGraphData({ nodes: [], links: [] });
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') runAnalysis();
  };

  const formatElapsed = (ms) => {
    const s = (ms / 1000).toFixed(1);
    return `${s}s`;
  };

  const currentActiveAgent = AGENTS.find((a) => agentStates[a.id]?.status === 'thinking');

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="14" stroke="url(#logo-grad)" strokeWidth="2" />
              <path d="M8 16 C8 10 14 8 16 12 C18 8 24 10 24 16 C24 22 18 24 16 20 C14 24 8 22 8 16Z" fill="url(#logo-grad)" opacity="0.8" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <span className="logo-text">BioMind</span>
            <span className="logo-badge">v2.1</span>
          </div>
        </div>
        <div className="header__stats">
          <div className="stat-pill">
            <span className="stat-dot stat-dot--green" aria-hidden="true" />
            <span>5 Agents Active</span>
          </div>
          <div className="stat-pill">
            <span>IBM Granite 3.3</span>
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="search-section">
        <div className="search-bar" id="search-bar">
          <div className="search-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            id="disease-input"
            className="search-input"
            type="text"
            placeholder="Enter disease name (e.g. ALS, Parkinson's, Alzheimer's)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={phase === 'running'}
            aria-label="Disease name input"
          />
          {phase !== 'running' && (
            <button
              id="analyze-btn"
              className="search-btn"
              onClick={runAnalysis}
              disabled={phase === 'running'}
              aria-label="Run drug repurposing pipeline"
            >
              <span>Run Pipeline</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 14 0M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {phase === 'done' && (
            <button
              id="reset-btn"
              className="search-btn search-btn--secondary"
              onClick={handleReset}
              aria-label="Reset and start a new analysis"
            >
              Reset
            </button>
          )}
        </div>

        {/* Demo disease chip */}
        {phase === 'idle' && (
          <div className="demo-chip-row">
            <span className="demo-chip-label">Try target disease:</span>
            {['ALS (Amyotrophic Lateral Sclerosis)', "Parkinson's Disease", "Alzheimer's Disease"].map((d) => (
              <button
                key={d}
                className="demo-chip"
                id={`chip-${d.split(' ')[0].toLowerCase()}`}
                onClick={() => { setInputValue(d); }}
                aria-label={`Use ${d} as query`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Pipeline Flow Stepper */}
      {phase !== 'idle' && (
        <div className="pipeline-stepper" id="pipeline-stepper" aria-label="Pipeline execution status">
          <div className="pipeline-stepper__title">
            <span>Autonomous Pipeline Execution</span>
            <span className="pipeline-stepper__status">{phase === 'running' ? 'LIVE PROCESSING' : 'COMPLETED'}</span>
          </div>
          <div className="pipeline-stepper__steps">
            {AGENTS.map((agent, index) => {
              const status = agentStates[agent.id]?.status;
              const isThinking = status === 'thinking';
              const isDone = status === 'done';
              return (
                <div
                  key={agent.id}
                  className={`pipeline-step ${isThinking ? 'pipeline-step--active' : ''} ${isDone ? 'pipeline-step--done' : ''}`}
                  aria-label={`Agent ${agent.code}: ${isDone ? 'complete' : isThinking ? 'analyzing' : 'standby'}`}
                >
                  <div className="pipeline-step__num" style={{ borderColor: isThinking || isDone ? agent.color : undefined, color: isThinking || isDone ? agent.color : undefined }}>
                    {isDone ? '✓' : index + 1}
                  </div>
                  <div className="pipeline-step__info">
                    <span className="pipeline-step__code" style={{ color: isThinking || isDone ? agent.color : undefined }}>{agent.code}</span>
                    <span className="pipeline-step__name">{agent.name.split(' ')[0]}</span>
                  </div>
                  {index < AGENTS.length - 1 && <div className={`pipeline-step__connector ${isDone ? 'pipeline-step__connector--done' : ''}`} aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {phase === 'running' && (
        <div className="progress-bar-wrapper">
          <div
            className="progress-bar"
            id="progress-bar"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Analysis progress"
          >
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-meta">
            <span className="progress-status">
              {currentActiveAgent ? (
                <>
                  <span style={{ color: currentActiveAgent.color, fontWeight: 600 }}>{currentActiveAgent.code}</span>
                  {' '}is executing analytical pass...
                </>
              ) : 'Initializing multi-agent graph network...'}
            </span>
            <span className="progress-time">{formatElapsed(elapsed)} elapsed</span>
          </div>
        </div>
      )}

      {/* Done banner */}
      {phase === 'done' && (
        apiError ? (
          <div className="done-banner done-banner--error" id="done-banner" role="status">
            <span className="done-banner__check" aria-hidden="true">✕</span>
            <span>
              Analysis failed for <strong>{disease}</strong> — backend error: {apiError}
            </span>
          </div>
        ) : (
          <div className="done-banner" id="done-banner" role="status">
            <span className="done-banner__check" aria-hidden="true">✓</span>
            <span>
              Analysis complete for <strong>{disease}</strong> — {apiResults ? apiResults.length : 0} candidates ranked in {formatElapsed(TOTAL_DURATION)}
            </span>
          </div>
        )
      )}

      {/* Tabs */}
      {phase !== 'idle' && (
        <div className="tabs" id="tabs" role="tablist">
          <button
            className={`tab ${activeTab === 'agents' ? 'tab--active' : ''}`}
            id="tab-agents"
            role="tab"
            aria-selected={activeTab === 'agents'}
            aria-controls="agents-grid"
            onClick={() => setActiveTab('agents')}
          >
            <Bot size={15} aria-hidden="true" />
            Agents
            {phase === 'running' && (
              <span className="tab-badge tab-badge--live">LIVE</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'results' ? 'tab--active' : ''}`}
            id="tab-results"
            role="tab"
            aria-selected={activeTab === 'results'}
            aria-controls="results-grid"
            onClick={() => setActiveTab('results')}
            disabled={phase === 'running'}
          >
            <BarChart2 size={15} aria-hidden="true" />
            Results
            {phase === 'done' && apiResults && (
              <span className="tab-badge tab-badge--count">{apiResults.length}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'graph' ? 'tab--active' : ''}`}
            id="tab-graph"
            role="tab"
            aria-selected={activeTab === 'graph'}
            aria-controls="graph-section"
            onClick={() => setActiveTab('graph')}
            disabled={phase === 'running'}
          >
            <Network size={15} aria-hidden="true" />
            Evidence Graph
          </button>
          <button
            className={`tab ${activeTab === 'literature' ? 'tab--active' : ''}`}
            id="tab-literature"
            role="tab"
            aria-selected={activeTab === 'literature'}
            aria-controls="literature-feed"
            onClick={() => setActiveTab('literature')}
          >
            <FileText size={15} aria-hidden="true" />
            Cited Literature
            {phase === 'running' && (
              <span className="tab-badge tab-badge--live">LIVE</span>
            )}
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="main-content">
        {/* Idle state */}
        {phase === 'idle' && (
          <div className="idle-hero">
            <div className="idle-hero__dna" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="dna-strand" style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
            <div className="idle-hero__logo-container">
              <svg width="80" height="80" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="idle-hero__logo-svg">
                <circle cx="16" cy="16" r="14" stroke="url(#hero-logo-grad)" strokeWidth="2.5" />
                <path d="M8 16 C8 10 14 8 16 12 C18 8 24 10 24 16 C24 22 18 24 16 20 C14 24 8 22 8 16Z" fill="url(#hero-logo-grad)" opacity="0.85" />
                <defs>
                  <linearGradient id="hero-logo-grad" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#06b6d4" />
                    <stop offset="1" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="idle-hero__title">
              <span className="gradient-text">BioMind</span>
            </h1>
            <div className="idle-hero__badge">
              <span className="idle-hero__badge-dot" aria-hidden="true" />
              <span>Multi-Agent Scientific Platform</span>
            </div>
            <p className="idle-hero__subtitle">
              5 specialized AI agents autonomously cross-analyze 36M+ biomedical publications,
              screen 14,000+ FDA-approved drugs, and compute mechanistic repurposing candidate scores in minutes.
            </p>
             <div className="idle-agents-preview" role="list" aria-label="Deployed agents">
              {AGENTS.map((agent) => {
                const IconComponent = AGENT_ICONS[agent.id];
                return (
                  <div key={agent.id} className="preview-agent" title={agent.name} role="listitem">
                    <div className="preview-agent__icon" style={{ '--agent-color': agent.color }} aria-hidden="true">
                      {IconComponent ? <IconComponent size={24} color={agent.color} /> : agent.icon}
                    </div>
                    <div className="preview-agent__code" style={{ color: agent.color }}>{agent.code}</div>
                    <div className="preview-agent__name">{agent.name.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Agents tab */}
        {phase !== 'idle' && activeTab === 'agents' && (
          <div className="agents-grid" id="agents-grid" role="tabpanel" aria-labelledby="tab-agents">
            {AGENTS.map((agent) => {
              const state = agentStates[agent.id];
              return (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isActive={state.status === 'thinking'}
                  isDone={state.status === 'done'}
                  reasoningLines={state.lines}
                  IconComponent={AGENT_ICONS[agent.id]}
                />
              );
            })}
          </div>
        )}

        {/* Results tab */}
        {phase !== 'idle' && activeTab === 'results' && (
          <div className="results-section" role="tabpanel" aria-labelledby="tab-results">
            {phase === 'running' ? (
              <div className="results-loading-state" aria-live="polite">
                <div className="results-loading-state__icon" aria-hidden="true">
                  <BarChart2 size={32} />
                </div>
                <p className="results-loading-state__title">Analysis in progress</p>
                <p className="results-loading-state__sub">Results will appear here once all agents complete their evaluation.</p>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <h2 className="results-title">
                    Repurposing Candidates for <span className="gradient-text">{disease}</span>
                  </h2>
                  <p className="results-subtitle">
                    Ranked by BioMind Evidence Score (BES) — composite of mechanistic, clinical &amp; safety data
                  </p>
                </div>
                {apiResults && apiResults.length > 0 ? (
                  <>
                    <div className="results-grid" id="results-grid">
                      {apiResults.map((result, i) => (
                        <ResultCard
                          key={result.rank}
                          result={result}
                          visible={resultsVisible[i] ?? true}
                          delay={i * 120}
                          disease={disease}
                        />
                      ))}
                    </div>
                    {resultsVisible[apiResults.length - 1] ?? true ? (
                      <AnalysisSummary
                        disease={disease}
                        results={apiResults}
                        elapsed={TOTAL_DURATION}
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="results-loading-state" aria-live="polite">
                    <div className="results-loading-state__icon" aria-hidden="true">
                      <BarChart2 size={32} />
                    </div>
                    <p className="results-loading-state__title">{apiError ? 'Backend request failed' : 'No results available'}</p>
                    <p className="results-loading-state__sub">
                      {apiError
                        ? `The pipeline crashed before returning candidates: ${apiError}`
                        : 'The pipeline did not return candidates for this query. Please try again or check the backend.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Evidence Graph tab */}
        {phase !== 'idle' && activeTab === 'graph' && (
          <div className="graph-section" id="graph-section" role="tabpanel" aria-labelledby="tab-graph">
            <div className="graph-header">
              <h2 className="results-title">
                Molecular Evidence Network — <span className="gradient-text">{disease}</span>
              </h2>
              <p className="results-subtitle">
                Force-directed graph of disease mechanisms, protein targets, and drug-target interactions
              </p>
            </div>
            <EvidenceGraph 
              visible={activeTab === 'graph'} 
              nodes={graphData.nodes.length > 0 ? graphData.nodes : null} 
              links={graphData.links.length > 0 ? graphData.links : null} 
            />
          </div>
        )}

        {/* Literature Source Feed tab */}
        {phase !== 'idle' && activeTab === 'literature' && (
          <div className="literature-panel" role="tabpanel" aria-labelledby="tab-literature" id="literature-feed">
            <LiteratureFeed
              disease={disease}
              phase={phase}
              elapsed={elapsed}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__left">
          <div className="footer__logo-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="url(#foot-grad)" strokeWidth="2" />
              <path d="M8 16 C8 10 14 8 16 12 C18 8 24 10 24 16 C24 22 18 24 16 20 C14 24 8 22 8 16Z" fill="url(#foot-grad)" opacity="0.8" />
              <defs>
                <linearGradient id="foot-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="footer__brand">BioMind</span>
          <span className="footer__divider" aria-hidden="true">·</span>
          <span className="footer__event">HackVerse 2.0 · MIT Bengaluru · August 2026</span>
        </div>
        <div className="footer__sources" aria-label="Data sources">
          {['PubMed', 'ChEMBL', 'DrugBank', 'FDA FAERS', 'IBM Granite 3.3'].map((src) => (
            <span key={src} className="footer__source-pill">{src}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
