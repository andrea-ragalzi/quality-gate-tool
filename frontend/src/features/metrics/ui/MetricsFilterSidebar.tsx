import React from "react";
import { Box, Stack, Checkbox, Text, TextInput } from "@mantine/core";
import { METRIC_TYPES, DateRange, SortOrder } from "../model/types";

interface MetricsFilterSidebarProps {
  availableTools: string[];
  selectedTools: string[];
  setSelectedTools: (val: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (val: string[]) => void;
  query: string;
  setQuery: (val: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (val: SortOrder) => void;
  dateRange: DateRange;
  setDateRange: (val: DateRange) => void;
  matrixGreen: string;
  matrixDark: string;
}

export const MetricsFilterSidebar: React.FC<MetricsFilterSidebarProps> = ({
  availableTools,
  selectedTools,
  setSelectedTools,
  selectedTypes,
  setSelectedTypes,
  query,
  setQuery,
}) => {
  const allTools = availableTools;
  const allTypes = [...METRIC_TYPES];

  const isToolChecked = (tool: string) =>
    selectedTools.length === 0 || selectedTools.includes(tool);

  const isTypeChecked = (type: string) =>
    selectedTypes.length === 0 || selectedTypes.includes(type);

  const toggleFromAllMeaningEmpty = (
    all: string[],
    selected: string[],
    item: string,
    checked: boolean,
    setSelected: (val: string[]) => void,
  ) => {
    if (!checked) {
      // Empty selection in state represents ALL selected.
      if (selected.length === 0) {
        setSelected(all.filter((x) => x !== item));
        return;
      }

      // Avoid falling back to empty (ALL) by unchecking the last remaining item.
      if (selected.length === 1 && selected[0] === item) {
        return;
      }

      setSelected(selected.filter((x) => x !== item));
      return;
    }

    // checked === true
    if (selected.length === 0) {
      // Already in ALL mode.
      return;
    }

    const next = Array.from(new Set([...selected, item]));
    if (next.length === all.length) {
      // Collapse explicit full selection back to ALL mode.
      setSelected([]);
      return;
    }

    setSelected(next);
  };

  return (
    <Stack gap="lg" className="metrics-filter">
      <Box component="fieldset" className="metrics-filter__group">
        <Text component="legend" className="metrics-filter__label">
          SEARCH
        </Text>
        <TextInput
          className="metrics-filter__input"
          placeholder="File, message..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </Box>

      <Box component="fieldset" className="metrics-filter__group">
        <Text component="legend" className="metrics-filter__label">
          SHOW TOOLS
        </Text>
        <Box className="metrics-filter__checkbox-list">
          {availableTools.map((tool) => (
            <Checkbox
              key={tool}
              className="metrics-filter__checkbox"
              label={tool}
              checked={isToolChecked(tool)}
              onChange={(event) => {
                toggleFromAllMeaningEmpty(
                  allTools,
                  selectedTools,
                  tool,
                  event.currentTarget.checked,
                  setSelectedTools,
                );
              }}
              color="green"
            />
          ))}
        </Box>
      </Box>

      <Box component="fieldset" className="metrics-filter__group">
        <Text component="legend" className="metrics-filter__label">
          SEVERITY
        </Text>
        <Box className="metrics-filter__checkbox-list">
          {METRIC_TYPES.map((type) => (
            <Checkbox
              key={type}
              className="metrics-filter__checkbox"
              label={type}
              checked={isTypeChecked(type)}
              onChange={(event) => {
                toggleFromAllMeaningEmpty(
                  allTypes,
                  selectedTypes,
                  type,
                  event.currentTarget.checked,
                  setSelectedTypes,
                );
              }}
              color="green"
            />
          ))}
        </Box>
      </Box>
    </Stack>
  );
};
