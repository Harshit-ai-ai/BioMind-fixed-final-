import { FileText, Award } from 'lucide-react';

export default function AnalysisSummary({ disease, results, elapsed }) {
  const topPick = results[0];
  const highConfidence = results.filter((r) => r.tier === 'High Confidence').length;
  const totalCitations = results.reduce((sum, r) => sum + r.citations, 0);
  const avgScore = (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2);

  return (
    <div className="summary-card" id="analysis-summary">
      <div className="summary-card__header">
        <div className="summary-header-left">
          <div className="summary-icon" aria-hidden="true">
            <FileText size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="summary-title">Analysis Summary</h3>
            <p className="summary-subtitle">BioMind multi-agent evaluation complete</p>
          </div>
        </div>
        <div className="summary-elapsed">
          <span className="summary-elapsed__label">Completed in</span>
          <span className="summary-elapsed__time">{(elapsed / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="summary-stats-row">
        <div className="summary-stat">
          <span className="summary-stat__value">{results.length}</span>
          <span className="summary-stat__label">Candidates Found</span>
        </div>
        <div className="summary-stat-divider" aria-hidden="true" />
        <div className="summary-stat">
          <span className="summary-stat__value" style={{ color: '#10b981' }}>{highConfidence}</span>
          <span className="summary-stat__label">High Confidence</span>
        </div>
        <div className="summary-stat-divider" aria-hidden="true" />
        <div className="summary-stat">
          <span className="summary-stat__value">{totalCitations}</span>
          <span className="summary-stat__label">Papers Cited</span>
        </div>
        <div className="summary-stat-divider" aria-hidden="true" />
        <div className="summary-stat">
          <span className="summary-stat__value">{avgScore}</span>
          <span className="summary-stat__label">Avg. BES Score</span>
        </div>
      </div>

      {/* Divider */}
      <div className="summary-divider" aria-hidden="true" />

      {/* Top recommendation */}
      <div className="summary-top-pick">
        <div className="summary-top-pick__label">
          <span className="top-pick-badge">
            <Award size={12} aria-hidden="true" />
            Top Recommendation
          </span>
        </div>
        <div className="summary-top-pick__content">
          <div className="summary-top-pick__drug">
            <span className="summary-drug-name">{topPick.drug}</span>
            <span className="summary-drug-score" style={{ color: topPick.tierColor }}>
              BES {Math.round(topPick.score * 100)}
            </span>
          </div>
          <p className="summary-top-pick__rationale">
            {topPick.drug} emerges as the strongest repurposing candidate for <strong>{disease}</strong> based on convergent mechanistic, clinical, and safety evidence.
            Its {topPick.mechanism.split('→')[0].trim().toLowerCase()} mechanism directly addresses the core pathomechanism of {disease},
            supported by {topPick.citations} peer-reviewed publications and Phase 3 clinical trial data.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="summary-divider" aria-hidden="true" />

      {/* Key findings */}
      <div className="summary-findings">
        <div className="summary-findings__label">Key Findings</div>
        <ul className="summary-findings__list">
          {results.map((r, idx) => (
            <li key={r.drug}>
              <span className="finding-dot" style={{ background: r.tierColor }} aria-hidden="true" />
              <span>
                <strong>{r.drug}</strong> (BES {Math.round(r.score * 100)}) — {r.mechanism ? r.mechanism.split('→')[0] : 'hypothesized mechanism'} targeting {r.target || 'relevant proteins'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="summary-divider" aria-hidden="true" />

      {/* Disclaimer */}
      <p className="summary-disclaimer">
        ⚠ BioMind outputs are for research hypothesis generation only and do not constitute medical advice.
        All candidates require independent clinical validation before therapeutic application.
        Data sourced from PubMed, ChEMBL 33, DrugBank 5.1.10, FDA FAERS, and ClinicalTrials.gov.
      </p>
    </div>
  );
}
