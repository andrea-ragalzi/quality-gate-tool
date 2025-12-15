"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Text } from "@mantine/core";
import {
  IconLoader,
  IconCheck,
  IconX,
  IconCopy,
  IconChevronDown,
} from "@tabler/icons-react";
import { Metrics } from "@/entities/analysis";

export interface ModuleCardProps {
  moduleId: string;
  title: string;
  subtitle?: string;
  icon: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  logs: string[];
  summary?: string;
  metrics?: Metrics;
  onViewLog: () => void;
}

export default function ModuleCard({
  moduleId,
  title,
  subtitle,
  icon: _icon,
  status,
  logs,
  summary,
  metrics,
  onViewLog,
}: ModuleCardProps) {
  void _icon;

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

  const getVisibleMetrics = () => {
    switch (moduleId) {
      case "B_Lizard":
        return ["COMPLEXITY"];
      case "F_TypeScript":
      case "B_Ruff":
      case "B_Pyright":
        return ["ERROR", "WARNING", "INFO"];
      case "F_ESLint":
        return ["ERROR", "WARNING"];
      default:
        return ["ERROR", "WARNING", "INFO", "COMPLEXITY"];
    }
  };

  const visibleMetrics = getVisibleMetrics();

  const getCompactMetrics = () => {
    if (!metrics) return null;

    const items = [] as Array<{ label: string; type: string }>;
    const { total_issues } = metrics;

    if (visibleMetrics.includes("ERROR") && total_issues.ERROR > 0) {
      items.push({ label: `${total_issues.ERROR}E`, type: "error" });
    }
    if (visibleMetrics.includes("WARNING") && total_issues.WARNING > 0) {
      items.push({ label: `${total_issues.WARNING}W`, type: "warning" });
    }
    if (visibleMetrics.includes("INFO") && total_issues.INFO > 0) {
      items.push({ label: `${total_issues.INFO}I`, type: "info" });
    }
    if (visibleMetrics.includes("COMPLEXITY") && total_issues.COMPLEXITY > 0) {
      items.push({ label: `${total_issues.COMPLEXITY}C`, type: "complexity" });
    }

    if (items.length === 0) {
      return [{ label: "No issues found", type: "success" }];
    }

    return items;
  };

  const compactMetrics = getCompactMetrics();

  return (
    <Box
      className={`module-card module-card--${status.toLowerCase()} ${
        isExpanded ? "module-card--expanded" : ""
      } ${hasContent ? "module-card--clickable" : ""}`}
      onClick={() => hasContent && setIsExpanded(!isExpanded)}
    >
      <Box className="module-card__header">
        <Box className="module-card__header-left">
          {getStatusIcon()}
          <Box className="module-card__header-info">
            <Box className="module-card__title">{title}</Box>
            {subtitle && (
              <Box className="module-card__subtitle">{subtitle}</Box>
            )}
          </Box>
        </Box>
        <Box className="module-card__header-right">
          <Box
            className={`module-card__status module-card__status--${status.toLowerCase()}`}
          >
            {status === "PASS"
              ? "PASSED"
              : status === "FAIL"
                ? "FAILED"
                : status}
          </Box>
          {compactMetrics ? (
            <Box className="module-card__issue-count module-card__issue-count--compact">
              {compactMetrics.map((item, idx) => (
                <Text
                  key={idx}
                  component="span"
                  className={`module-card__metric-item module-card__metric-item--${item.type}`}
                >
                  {item.label}
                </Text>
              ))}
            </Box>
          ) : (
            summary && (
              <Box className="module-card__issue-count">
                {summary.replace(/^(❌|✅|⚠️)\s*/u, "")}
              </Box>
            )
          )}
          {hasContent && (
            <IconChevronDown
              size={20}
              className={`module-card__chevron ${
                isExpanded ? "module-card__chevron--expanded" : ""
              }`}
            />
          )}
        </Box>
      </Box>

      {hasContent && (
        <>
          {isExpanded && (
            <Box
              className="module-card__expanded-content"
              onClick={(e) => e.stopPropagation()}
            >
              {logs.length > 0 && (
                <>
                  <Box component="pre" className="module-card__logs-pre">
                    {logs.slice(-5).join("\n")}
                  </Box>
                  <Box className="module-card__actions">
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
                  </Box>
                </>
              )}
            </Box>
          )}
        </>
      )}

      {(status === "RUNNING" || status === "PENDING") && (
        <Box className="module-card__progress-bar" />
      )}

      {showMatrixRain && (
        <Box ref={rainContainerRef} className="matrix-rain-container" />
      )}
    </Box>
  );
}
