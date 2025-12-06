"use client";

interface ToolResult {
  name: string;
  role: string;
  status: string;
  severity: string;
  details: string;
}

interface Props {
  tool: ToolResult;
}

export default function ToolCard({ tool }: Props) {
  const getStatusClass = () => {
    if (tool.status === "PASSED") return "tool-card--pass";
    if (tool.status === "FAILED") return "tool-card--fail";
    if (tool.status === "PENDING") return "tool-card--pending";
    return "tool-card--skipped";
  };

  const getIconClass = () => {
    if (tool.status === "PASSED") return "tool-card__icon--pass";
    if (tool.status === "FAILED") return "tool-card__icon--fail";
    if (tool.status === "PENDING") return "tool-card__icon--pending";
    return "tool-card__icon--skipped";
  };

  const getIcon = () => {
    if (tool.status === "PASSED") return "✓";
    if (tool.status === "FAILED") return "✗";
    if (tool.status === "PENDING") return "⟳";
    return "○";
  };

  return (
    <div className={`tool-card ${getStatusClass()}`}>
      {tool.status === "PENDING" && (
        <>
          <div className="matrix-rain-container">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="matrix-char"
                style={{
                  left: `${i * 20}%`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  animationDelay: `${Math.random()}s`,
                }}
              >
                {String.fromCharCode(0x30a0 + Math.random() * 96)}
              </span>
            ))}
          </div>
          <div className="pending-progress"></div>
        </>
      )}

      {/* Header */}
      <div className="tool-card__header">
        <div className="tool-card__header-left">
          <span
            className={`tool-card__icon ${getIconClass()} ${
              tool.status === "PENDING" ? "pending-icon" : ""
            }`}
          >
            {getIcon()}
          </span>
          <div>
            <h3
              className={`tool-card__title ${
                tool.status === "PENDING" ? "pending-text" : ""
              }`}
            >
              {tool.name}
            </h3>
            <p className="tool-card__role">{tool.role}</p>
          </div>
        </div>
        <span
          className={`tool-card__status-badge tool-card__status-badge--${tool.status.toLowerCase()}`}
        >
          {tool.status}
        </span>
      </div>

      {/* Severity/Count */}
      {tool.severity && (
        <div className="tool-card__severity">
          <div className="tool-card__severity-row">
            <span className="tool-card__label">Found:</span>
            <span
              className={`tool-card__value ${
                tool.status === "FAILED"
                  ? "tool-card__value--fail"
                  : "tool-card__value--pass"
              }`}
            >
              {tool.severity}
            </span>
          </div>
        </div>
      )}

      {/* Details */}
      {tool.details && tool.details.trim() && (
        <details className="tool-card__details">
          <summary className="tool-card__summary">View Details ▼</summary>
          <pre className="tool-card__pre">{tool.details}</pre>
        </details>
      )}
    </div>
  );
}
