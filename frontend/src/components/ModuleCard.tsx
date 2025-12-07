"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import {
  IconLoader,
  IconCheck,
  IconX,
  IconCopy,
  IconChevronDown,
} from "@tabler/icons-react";

interface ModuleCardProps {
  moduleId: string;
  title: string;
  subtitle?: string;
  icon: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  logs: string[];
  summary?: string;
  onViewLog: () => void;
}

export default function ModuleCard({
  moduleId,
  title,
  subtitle,
  icon,
  status,
  logs,
  summary,
  onViewLog,
}: ModuleCardProps) {
  const rainContainerRef = useRef<HTMLDivElement>(null);
  const [showMatrixRain, setShowMatrixRain] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Matrix Rain Effect - ONLY when RUNNING
  useEffect(() => {
    if (status === "RUNNING") {
      setShowMatrixRain(true);
      startMatrixRain();
    } else {
      setShowMatrixRain(false);
      stopMatrixRain();
    }
  }, [status]);

  const startMatrixRain = () => {
    const container = rainContainerRef.current;
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 50; i++) {
      const char = document.createElement("span");
      char.className = "matrix-char";
      char.textContent = String.fromCharCode(0x30a0 + Math.random() * 96);

      const randomX = Math.floor(Math.random() * 100);
      const duration = 2 + Math.random() * 5;
      const delay = Math.random() * -duration;

      char.style.left = `${randomX}%`;
      char.style.animationDuration = `${duration}s`;
      char.style.animationDelay = `${delay}s`;

      if (Math.random() > 0.7) {
        char.classList.add("bright");
      } else if (Math.random() < 0.3) {
        char.classList.add("dim");
      }

      container.appendChild(char);
    }
  };

  const stopMatrixRain = () => {
    const container = rainContainerRef.current;
    if (container) {
      container.innerHTML = "";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "RUNNING":
      case "PENDING":
        return (
          <IconLoader
            className="module-card__icon module-card__icon--pending"
            size={24}
          />
        );
      case "PASS":
        return (
          <IconCheck
            className="module-card__icon module-card__icon--pass"
            size={24}
          />
        );
      case "FAIL":
        return (
          <IconX
            className="module-card__icon module-card__icon--fail"
            size={24}
          />
        );
      default:
        return <IconLoader className="module-card__icon" size={24} />;
    }
  };

  const hasContent = summary || logs.length > 0;

  return (
    <div
      className={`module-card module-card--${status.toLowerCase()} ${
        isExpanded ? "module-card--expanded" : ""
      } ${hasContent ? "module-card--clickable" : ""}`}
      onClick={() => hasContent && setIsExpanded(!isExpanded)}
    >
      <div className="module-card__header">
        <div className="module-card__header-left">
          {getStatusIcon()}
          <div className="module-card__header-info">
            <div className="module-card__title">{title}</div>
            {subtitle && (
              <div className="module-card__subtitle">{subtitle}</div>
            )}
          </div>
        </div>
        <div className="module-card__header-right">
          <div
            className={`module-card__status module-card__status--${status.toLowerCase()}`}
          >
            {status === "PASS"
              ? "PASSED"
              : status === "FAIL"
                ? "FAILED"
                : status}
          </div>
          {summary && (
            <div className="module-card__issue-count">
              {summary.replace(/^[❌✅⚠️]\s*/u, "")}
            </div>
          )}
          {hasContent && (
            <IconChevronDown
              size={20}
              className={`module-card__chevron ${
                isExpanded ? "module-card__chevron--expanded" : ""
              }`}
            />
          )}
        </div>
      </div>

      {hasContent && (
        <>
          {isExpanded && (
            <div
              className="module-card__expanded-content"
              onClick={(e) => e.stopPropagation()}
            >
              {logs.length > 0 && (
                <>
                  <pre className="module-card__logs-pre">
                    {logs.slice(-5).join("\n")}
                  </pre>
                  <div className="module-card__actions">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewLog();
                      }}
                      className="module-card__view-btn"
                    >
                      View Full Log →
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      className="module-card__copy-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(logs.join("\n"));
                      }}
                      title="Copy Logs"
                    >
                      <IconCopy size={16} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {(status === "RUNNING" || status === "PENDING") && (
        <div className="module-card__progress-bar" />
      )}

      {showMatrixRain && (
        <div ref={rainContainerRef} className="matrix-rain-container" />
      )}
    </div>
  );
}
