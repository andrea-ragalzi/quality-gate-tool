import React from "react";
import { Box, Text, UnstyledButton } from "@mantine/core";
import { DashboardHeaderProps } from "../model/types";

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  metrics,
  projectPath,
  isWatching,
  isAnalyzing,
  onStartWatch,
  onStopWatch,
  onToggleSettings,
}) => {
  return (
    <Box component="header" className="top-header">
      <Box className="brand">
        <Text component="span" className="brand-title">
          Quality Gate
        </Text>
        <Text component="span" className="brand-subtitle">
          TERMINAL v2.0
        </Text>
      </Box>

      {/* Center: Metrics Summary */}
      <Box className="metrics-summary">
        <Box className="metric-item" title="Total Errors">
          <Text component="span" className="metric-value color-err">
            {metrics.Error}
          </Text>
          <Text component="span" className="metric-label">
            ERRORS
          </Text>
        </Box>
        <Box className="metric-item" title="Total Warnings">
          <Text component="span" className="metric-value color-warn">
            {metrics.Warning}
          </Text>
          <Text component="span" className="metric-label">
            WARNINGS
          </Text>
        </Box>
        <Box className="metric-item" title="Total Info">
          <Text component="span" className="metric-value color-info">
            {metrics.Info}
          </Text>
          <Text component="span" className="metric-label">
            INFO
          </Text>
        </Box>
        <Box className="metric-item" title="Average Complexity">
          <Text component="span" className="metric-value color-cmplx">
            {metrics.Complexity.toFixed(1)}
          </Text>
          <Text component="span" className="metric-label">
            CMPLX
          </Text>
        </Box>
      </Box>

      {/* Right: Controls */}
      <Box className="global-controls">
        {!isWatching ? (
          <UnstyledButton
            className="btn"
            onClick={onStartWatch}
            disabled={isAnalyzing || !projectPath}
            type="button"
          >
            START WATCH
          </UnstyledButton>
        ) : (
          <UnstyledButton
            className="btn btn-danger"
            onClick={onStopWatch}
            type="button"
          >
            STOP WATCH
          </UnstyledButton>
        )}
        <UnstyledButton
          className="btn btn-icon"
          title="Header Settings"
          aria-label="Header Settings"
          onClick={onToggleSettings}
          type="button"
        >
          ⚙️
        </UnstyledButton>
      </Box>
    </Box>
  );
};
