import { useEffect, useRef } from 'react';

export default function AgentCard({ agent, isActive, isDone, reasoningLines, IconComponent }) {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [reasoningLines]);

  const statusClass = isDone ? 'done' : isActive ? 'thinking' : 'idle';

  return (
    <div className={`agent-card agent-card--${statusClass}`} id={`agent-${agent.id}`}>
      {/* Animated border glow when thinking */}
      {isActive && <div className="agent-card__glow" style={{ '--agent-color': agent.color }} />}

      <div className="agent-card__header">
        <div className="agent-icon-wrapper" style={{ '--agent-color': agent.color }}>
          <span className="agent-icon">
            {IconComponent ? <IconComponent size={22} color={agent.color} /> : agent.icon}
          </span>
          {isActive && (
            <div className="agent-icon__pulse-ring" style={{ '--agent-color': agent.color }} />
          )}
        </div>

        <div className="agent-info">
          <div className="agent-code-row">
            <span className="agent-code" style={{ color: agent.color }}>
              {agent.code}
            </span>
            <span className={`agent-status-badge agent-status-badge--${statusClass}`}>
              {isDone ? '✓ Complete' : isActive ? 'Analyzing...' : 'Standby'}
            </span>
          </div>
          <div className="agent-name">{agent.name}</div>
        </div>
      </div>

      {isActive && (
        <div className="agent-thinking-bar">
          <div
            className="agent-thinking-bar__fill"
            style={{ '--agent-color': agent.color }}
          />
        </div>
      )}

      <div className="agent-role-text">{agent.role}</div>

      {reasoningLines && reasoningLines.length > 0 && (
        <div className="agent-terminal" ref={terminalRef}>
          {reasoningLines.map((line, i) => (
            <div key={i} className={`terminal-line ${i === reasoningLines.length - 1 && isActive ? 'terminal-line--active' : ''}`}>
              <span className="terminal-prompt" style={{ color: agent.color }}>›</span>
              <span className="terminal-text">{line}</span>
            </div>
          ))}
          {isActive && (
            <div className="terminal-cursor">
              <span className="terminal-prompt" style={{ color: agent.color }}>›</span>
              <span className="terminal-blink">█</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
