import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react';
import { PAPERS_DATA } from '../data/papersData';

export default function ResultCard({ result, visible, delay = 0, disease }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scorePercent = Math.round(result.score * 100);

  // Fuzzy match disease key for papersData lookup
  const getDiseaseKey = (name) => {
    if (!name) return 'ALS';
    const lower = name.toLowerCase();
    const matched = Object.keys(PAPERS_DATA).find(
      (key) =>
        key.toLowerCase().includes(lower) ||
        lower.includes(key.toLowerCase().split("'")[0].toLowerCase())
    );
    return matched || 'ALS';
  };

  const diseaseKey = getDiseaseKey(disease);
  const papers = PAPERS_DATA[diseaseKey] || [];

  // Extract keywords to match from result.target (e.g., "TDP-43", "SOD1")
  const getKeywords = () => {
    if (!result.target) return [];
    return result.target
      .split(/[,()&/\-\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 2 && !['modulator', 'inhibitor', 'receptor', 'subunit', 'channel', 'kinase', 'activator', 'target', 'reference', 'and', 'with'].includes(t.toLowerCase()));
  };

  const keywords = getKeywords();
  const matchedPapers = papers.filter(paper => {
    const text = `${paper.title} ${paper.abstract}`.toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  }).slice(0, 3); // Limit to top 3 supporting papers for readability

  // Helper to highlight matching keywords in text
  const highlightText = (text, kws) => {
    if (!kws || kws.length === 0) return text;
    let highlighted = text;
    const sortedKws = [...kws].sort((a, b) => b.length - a.length);
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    sortedKws.forEach(kw => {
      const escaped = escapeRegExp(kw);
      const regex = new RegExp(`(${escaped})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="highlight-target">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div
      className={`result-card ${visible ? 'result-card--visible' : ''} ${isExpanded ? 'result-card--expanded' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      id={`result-${result.rank}`}
    >
      {/* Rank badge */}
      <div className="result-rank">
        <span className="result-rank__number">#{result.rank}</span>
      </div>

      {/* Drug header */}
      <div className="result-header">
        <div>
          <h3 className="result-drug-name">{result.drug}</h3>
          <p className="result-original-indication">
            Originally: <em>{result.originalIndication}</em>
          </p>
        </div>
        <div className="result-score-ring" style={{ '--score-color': result.tierColor }}>
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke={result.tierColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - result.score)}`}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
            <text x="40" y="45" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">
              {scorePercent}
            </text>
          </svg>
          <span className="score-label">BES</span>
        </div>
      </div>

      {/* Tier badge */}
      <div className="result-tier-badge" style={{ '--tier-color': result.tierColor, background: `${result.tierColor}22`, borderColor: result.tierColor }}>
        {result.tier}
      </div>

      {/* Live-source badge — shown when this candidate came from a live
          ClinicalTrials.gov condition lookup rather than the curated
          ChEMBL cache, so it's clear where the data came from. */}
      {result.source === 'clinicaltrials.gov' && (
        <div
          className="result-tier-badge"
          style={{ '--tier-color': '#06b6d4', background: '#06b6d422', borderColor: '#06b6d4', marginLeft: 8 }}
        >
          Live: ClinicalTrials.gov
        </div>
      )}

      {/* Mechanism */}
      <div className="result-section">
        <div className="result-section__label">Mechanism of Action</div>
        <p className="result-mechanism">{result.mechanism}</p>
      </div>

      {/* Evidence */}
      <div className="result-section">
        <div className="result-section__label">Clinical Evidence</div>
        <p className="result-evidence">{result.evidence}</p>
      </div>

      {/* Metadata row */}
      <div className="result-meta-row">
        <div className="result-meta-item">
          <span className="result-meta-label">Target(s)</span>
          <span className="result-meta-value result-targets">{result.target}</span>
        </div>
        <div className="result-meta-item">
          <span className="result-meta-label">BBB Penetration</span>
          <span className={`result-meta-value ${result.bbp === true ? 'result-meta--positive' : result.bbp === false ? 'result-meta--negative' : ''}`}>
            {result.bbp === true ? '✓ Confirmed' : result.bbp === false ? '✗ Limited' : '— Unknown'}
          </span>
        </div>
        <div className="result-meta-item">
          <span className="result-meta-label">Citations</span>
          <span className="result-meta-value">
            {matchedPapers.length > 0
              ? `${matchedPapers.length} papers`
              : `${result.citations} ${result.citationsLabel || 'clinical trials'}`}
          </span>
        </div>
      </div>

      {/* Safety flag */}
      {result.safetyFlag && (
        <div className="result-safety-flag">
          <span className="safety-icon">⚠️</span>
          <span>{result.safetyFlag}</span>
        </div>
      )}

      {/* Real ClinicalTrials.gov record links — direct, verifiable
          evidence for candidates sourced live rather than from the
          curated cache. */}
      {result.nctIds && result.nctIds.length > 0 && (
        <div className="result-section">
          <div className="result-section__label">ClinicalTrials.gov Records</div>
          <div className="result-meta-value">
            {result.nctIds.map((id, idx) => (
              <span key={id}>
                <a
                  href={`https://clinicaltrials.gov/study/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-pmid-link"
                >
                  {id}
                </a>
                {idx < result.nctIds.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Traceable Evidence Accordion Toggle */}
      {matchedPapers.length > 0 && (
        <div className="traceability-wrapper">
          <button 
            className={`traceability-toggle ${isExpanded ? 'traceability-toggle--active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <div className="traceability-toggle__label">
              <BookOpen size={14} className="traceability-toggle__icon" />
              <span>Verify Evidence Traceability ({matchedPapers.length} papers matched)</span>
            </div>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExpanded && (
            <div className="traceability-content">
              <div className="traceability-intro">
                <ShieldCheck size={14} className="text-success" style={{ color: '#10b981', marginRight: '6px' }} />
                <span>The following publications directly support the biological linkage for target <strong>{result.target}</strong>:</span>
              </div>
              <div className="traceability-papers-list">
                {matchedPapers.map((paper) => (
                  <div key={paper.pmid} className="trace-paper-card">
                    <div className="trace-paper-header">
                      <span className="trace-paper-pmid">PMID: {paper.pmid}</span>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="trace-paper-link"
                      >
                        <span>Open Source</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <h4 className="trace-paper-title">{highlightText(paper.title, keywords)}</h4>
                    <p className="trace-paper-abstract">
                      {highlightText(
                        paper.abstract.length > 220 
                          ? paper.abstract.substring(0, 220) + '...' 
                          : paper.abstract, 
                        keywords
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
