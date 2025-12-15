import React from "react";
import { Box, Checkbox, Text, TextInput, UnstyledButton } from "@mantine/core";
import { LeftSidebarProps, RightSidebarProps } from "../model/types";
import { getWatchStatus } from "../lib";

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onToggle,
  tools,
  selectedTools,
  selectedTypes,
  query,
  onToolFilterChange,
  onTypeFilterChange,
  onQueryChange,
}) => {
  return (
    <Box
      className={`sidebar-host sidebar-left-host ${!isOpen ? "collapsed" : ""}`}
    >
      <UnstyledButton
        className="sidebar-toggle-left"
        onClick={onToggle}
        type="button"
        title="Toggle Filters"
        aria-label="Toggle Filters"
      >
        <Text component="span">{isOpen ? "◀" : "🔍"}</Text>
      </UnstyledButton>

      <Box
        component="aside"
        className={`sidebar sidebar-left ${!isOpen ? "collapsed" : ""}`}
      >
        {isOpen && (
          <>
            <Text component="div" className="sidebar-section-title">
              🔍 VIEW FILTERS
            </Text>

            <Box className="filter-group">
              <TextInput
                label="SEARCH"
                classNames={{ label: "filter-label", input: "input" }}
                placeholder="File, message..."
                value={query}
                onChange={(e) => onQueryChange(e.currentTarget.value)}
              />
            </Box>

            <Box className="filter-group">
              <Text component="div" className="filter-label">
                SHOW TOOLS
              </Text>
              <Box className="checkbox-list">
                {tools.map((tool) => (
                  <Checkbox
                    key={tool.id}
                    label={tool.title}
                    checked={selectedTools.includes(tool.title)}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        onToolFilterChange([...selectedTools, tool.title]);
                      } else {
                        onToolFilterChange(
                          selectedTools.filter((t) => t !== tool.title),
                        );
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box className="filter-group">
              <Text component="div" className="filter-label">
                SEVERITY
              </Text>
              <Box className="checkbox-list">
                <Checkbox
                  label={
                    <Text component="span" className="color-err">
                      Error
                    </Text>
                  }
                  checked={selectedTypes.includes("Error")}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      onTypeFilterChange([...selectedTypes, "Error"]);
                    } else {
                      onTypeFilterChange(
                        selectedTypes.filter((t) => t !== "Error"),
                      );
                    }
                  }}
                />
                <Checkbox
                  label={
                    <Text component="span" className="color-warn">
                      Warning
                    </Text>
                  }
                  checked={selectedTypes.includes("Warning")}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      onTypeFilterChange([...selectedTypes, "Warning"]);
                    } else {
                      onTypeFilterChange(
                        selectedTypes.filter((t) => t !== "Warning"),
                      );
                    }
                  }}
                />
                <Checkbox
                  label="Info"
                  checked={selectedTypes.includes("Info")}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      onTypeFilterChange([...selectedTypes, "Info"]);
                    } else {
                      onTypeFilterChange(
                        selectedTypes.filter((t) => t !== "Info"),
                      );
                    }
                  }}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onToggle,
  isWatching,
  projectPath,
  tools,
  enabledModules,
  onProjectPathChange,
  onOpenProjectModal,
  onModuleToggle,
}) => {
  const watchStatus = getWatchStatus(isWatching);

  return (
    <Box
      className={`sidebar-host sidebar-right-host ${
        !isOpen ? "collapsed" : ""
      }`}
    >
      <UnstyledButton
        className="sidebar-toggle-right"
        onClick={onToggle}
        type="button"
        title="Toggle Settings"
        aria-label="Toggle Settings"
      >
        <Text component="span">⚙️</Text>
      </UnstyledButton>

      <Box
        component="aside"
        className={`sidebar sidebar-right ${!isOpen ? "collapsed" : ""}`}
      >
        <Box className={`sidebar-content ${isOpen ? "open" : "closed"}`}>
          <Text component="div" className="sidebar-section-title">
            ⚙️ CONFIGURATION
          </Text>

          {/* Status Indicator */}
          <Box className="status-indicator">
            <Box
              component="span"
              className={`status-dot ${watchStatus.dotVariantClass}`}
            />
            <Text component="span" className="status-text">
              {watchStatus.text}
            </Text>
          </Box>

          {/* Project Selection */}
          <Box className="config-block">
            <TextInput
              label="PROJECT PATH"
              classNames={{
                label: "filter-label",
                input: "input input-compact",
              }}
              value={projectPath || ""}
              onChange={(e) => onProjectPathChange(e.currentTarget.value)}
              placeholder="/path/to/project"
            />
            <UnstyledButton
              className="btn btn-full"
              onClick={onOpenProjectModal}
              type="button"
            >
              CHANGE PROJECT
            </UnstyledButton>
          </Box>

          {/* Active Tools Config */}
          <Box className="filter-group">
            <Text component="div" className="filter-label">
              ACTIVE MODULES (RUN)
            </Text>
            <Text component="div" className="helper-text">
              Select which tools to execute.
            </Text>
            <Box className="checkbox-list checkbox-list-cyan">
              {tools.map((module) => (
                <Checkbox
                  key={module.id}
                  checked={enabledModules.includes(module.id)}
                  onChange={(e) =>
                    onModuleToggle(module.id, e.currentTarget.checked)
                  }
                  label={
                    <Text component="span" className="color-cyan">
                      {module.title}
                    </Text>
                  }
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
