import React from "react";
import { Box, Text, UnstyledButton } from "@mantine/core";
import { ModuleCardProps, ModulesSectionProps } from "../model/types";
import {
  getModuleStatusClass,
  getModuleSummaryText,
  extractRecentErrors,
} from "../lib";

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  logData,
  onClick,
}) => {
  const status = logData.status || "PENDING";
  const logs = logData.logs || [];
  const statusClass = getModuleStatusClass(status);
  const summaryText = getModuleSummaryText(status, logs);
  const recentErrors = extractRecentErrors(logs);

  return (
    <UnstyledButton type="button" className="module-card" onClick={onClick}>
      <Box className="module-card-header">
        <Text component="strong">{module.title.toUpperCase()}</Text>
        <Text
          component="span"
          className={`module-status module-status-${statusClass}`}
        >
          {status === "PASS" ? "OK" : status}
        </Text>
      </Box>
      <Box className="module-metric">{summaryText}</Box>
      <Box className="module-timestamp">
        {logData.summary || "Last scan: --"}
      </Box>
      {recentErrors.length > 0 && (
        <Box className="module-preview">
          {recentErrors.map((err, i) => (
            <Box key={i}>{err}</Box>
          ))}
        </Box>
      )}
    </UnstyledButton>
  );
};

export const ModulesSection: React.FC<ModulesSectionProps> = ({
  tools,
  enabledModules,
  moduleLogs,
  isExpanded,
  onToggleExpand,
  onViewLog,
}) => {
  const activeTools = tools.filter((t) => enabledModules.includes(t.id));

  return (
    <Box className={`modules-section ${isExpanded ? "expanded" : "collapsed"}`}>
      <UnstyledButton
        type="button"
        className="modules-header"
        onClick={onToggleExpand}
      >
        <Box className="modules-title">{`> ACTIVE MODULES (${enabledModules.length})`}</Box>
        <Box>{isExpanded ? "▼" : "▲"}</Box>
      </UnstyledButton>
      <Box className="modules-scroll-container">
        {activeTools.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            logData={moduleLogs[module.id] || {}}
            onClick={() => onViewLog(module.id)}
          />
        ))}
      </Box>
    </Box>
  );
};
