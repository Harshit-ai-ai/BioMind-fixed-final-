import { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, ExternalLink, Cpu } from 'lucide-react';
import { PAPERS_DATA } from '../data/papersData';

export default function LiteratureFeed({ disease, phase, elapsed }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePaperIndex, setActivePaperIndex] = useState(0);
  const containerRef = useRef(null);

  // Normalize disease key for data lookup — fuzzy match any key in PAPERS_DATA
  const getDiseaseKey = () => {
    if (!disease) return Object.keys(PAPERS_DATA)[0];
    const lower = disease.toLowerCase();
    // Try to find any key that partially matches the input or vice versa
    const matched = Object.keys(PAPERS_DATA).find(
      (key) =>
        key.toLowerCase().includes(lower) ||
        lower.includes(key.toLowerCase().split("'")[0].toLowerCase()) // e.g. "alzheimer" matches "Alzheimer's Disease"
    );
    return matched || Object.keys(PAPERS_DATA)[0];
  };

  const diseaseKey = getDiseaseKey();
  const papers = PAPERS_DATA[diseaseKey] || [];

  // Simulate scanning of papers during the first ~4 seconds (LEXIS phase)
  useEffect(() => {
    if (phase === 'running') {
      const interval = setInterval(() => {
        setActivePaperIndex((prev) => (prev + 1) % Math.max(1, papers.length));
      }, 600); // cycle papers quickly to show high-throughput scanning
      return () => clearInterval(interval);
    }
  }, [phase, papers.length]);

  // Scroll active paper into view in the terminal list during scanning without scrolling the window
  useEffect(() => {
    if (phase === 'running' && containerRef.current) {
      const listEl = containerRef.current.querySelector('.lit-terminal-list');
      const activeEl = containerRef.current.querySelector('.paper-item--scanning');
      if (listEl && activeEl) {
        const containerTop = listEl.scrollTop;
        const containerBottom = containerTop + listEl.clientHeight;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.offsetHeight;

        if (elemTop < containerTop) {
          listEl.scrollTo({ top: elemTop, behavior: 'smooth' });
        } else if (elemBottom > containerBottom) {
          listEl.scrollTo({ top: elemBottom - listEl.clientHeight, behavior: 'smooth' });
        }
      }
    }
  }, [activePaperIndex, phase]);

  const filteredPapers = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pmid.includes(searchTerm)
  );

  return (
    <div className="literature-feed" id="literature-feed">
      {phase === 'running' ? (
        // LIVE SCANNING MODE
        <div className="lit-scanning">
          <div className="lit-scanning__header">
            <div className="lit-pulse-dot" />
            <span className="lit-scanning__title">LEXIS Agent: High-Throughput Literature Triage</span>
            <span className="lit-scanning__speed">Scanning ~80 papers/sec</span>
          </div>

          <div className="lit-layout">
            {/* Live Terminal List */}
            <div className="lit-terminal-col" ref={containerRef}>
              <div className="lit-terminal-title">Active Retrieval Log</div>
              <div className="lit-terminal-list">
                {papers.map((paper, idx) => {
                  const isCurrent = idx === activePaperIndex;
                  return (
                    <div
                      key={paper.pmid}
                      className={`paper-item ${isCurrent ? 'paper-item--scanning' : 'paper-item--queued'}`}
                    >
                      <span className="paper-pmid-tag">PMID:{paper.pmid}</span>
                      <span className="paper-title-trim">{paper.title}</span>
                      {isCurrent && <span className="scanning-tag">EXTRACTING...</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parsing Details Panel */}
            <div className="lit-details-col">
              {papers[activePaperIndex] && (
                <div className="active-paper-card">
                  <div className="active-paper-header">
                    <span className="active-paper-status">
                      <Cpu size={14} className="spin-slow" />
                      Parsing Entities &amp; Relations
                    </span>
                    <span className="active-paper-pmid">PMID: {papers[activePaperIndex].pmid}</span>
                  </div>
                  <h4 className="active-paper-title">{papers[activePaperIndex].title}</h4>
                  <div className="active-paper-body">
                    <div className="active-paper-label">Abstract Context:</div>
                    <p className="active-paper-abstract">{papers[activePaperIndex].abstract}</p>
                  </div>
                  <div className="active-paper-footer">
                    <div className="scanning-bar-anim" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // COMPLETED BROWSER MODE
        <div className="lit-browser">
          <div className="lit-browser__header">
            <div className="lit-browser__title-group">
              <h3 className="lit-browser__title">
                Cited Source Literature ({papers.length} Papers)
              </h3>
              <p className="lit-browser__sub">
                Ground-truth publications parsed and used to extract target pathways for {disease}
              </p>
            </div>
            
            {/* Search Input */}
            <div className="lit-search-wrapper">
              <Search className="lit-search-icon" size={16} />
              <input
                type="text"
                placeholder="Search titles, abstracts, or PMIDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lit-search-input"
              />
            </div>
          </div>

          {/* Grid Layout of Citations */}
          <div className="lit-grid">
            {filteredPapers.map((paper, idx) => (
              <div key={paper.pmid} className="paper-card" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="paper-card__header">
                  <span className="paper-card__pmid-badge">PMID: {paper.pmid}</span>
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-card__link"
                    title="Open on PubMed"
                  >
                    <span>PubMed</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <h4 className="paper-card__title">{paper.title}</h4>
                <p className="paper-card__abstract">{paper.abstract}</p>
              </div>
            ))}

            {filteredPapers.length === 0 && (
              <div className="lit-empty-state">
                <BookOpen size={32} />
                <p>No cited papers match your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
