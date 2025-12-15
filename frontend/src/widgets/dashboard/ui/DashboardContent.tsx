import React, { useCallback, useRef } from "react";
import { Box, UnstyledButton } from "@mantine/core";
import { MatrixEditor } from "@/shared";
import {
  serializeJSON,
  serializeYAML,
  serializeTOON,
} from "@/features/metrics";
import { ContentAreaProps, ViewTabsProps, ViewTab } from "../model/types";
import { FindingsTable } from "./FindingsTable";

const VIEW_TABS: ViewTab[] = ["TABLE", "JSON", "YAML", "TOON"];

function getTabId(tab: ViewTab): string {
  return `view-tab-${tab.toLowerCase()}`;
}

function getPanelId(tab: ViewTab): string {
  return `view-panel-${tab.toLowerCase()}`;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTabAtIndex = useCallback((index: number) => {
    tabRefs.current[index]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = VIEW_TABS.length - 1;

      switch (event.key) {
        case "ArrowRight": {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          const nextTab = VIEW_TABS[nextIndex];
          onTabChange(nextTab);
          focusTabAtIndex(nextIndex);
          return;
        }
        case "ArrowLeft": {
          event.preventDefault();
          const nextIndex = index === 0 ? lastIndex : index - 1;
          const nextTab = VIEW_TABS[nextIndex];
          onTabChange(nextTab);
          focusTabAtIndex(nextIndex);
          return;
        }
        case "Home": {
          event.preventDefault();
          onTabChange(VIEW_TABS[0]);
          focusTabAtIndex(0);
          return;
        }
        case "End": {
          event.preventDefault();
          onTabChange(VIEW_TABS[lastIndex]);
          focusTabAtIndex(lastIndex);
          return;
        }
        default:
          return;
      }
    },
    [focusTabAtIndex, onTabChange],
  );

  return (
    <Box className="view-tabs" role="tablist" aria-label="View">
      {VIEW_TABS.map((tab, index) => (
        <UnstyledButton
          key={tab}
          ref={(node) => {
            tabRefs.current[index] = node;
          }}
          type="button"
          className={`tab ${activeTab === tab ? "active" : ""}`}
          onClick={() => onTabChange(tab)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          role="tab"
          id={getTabId(tab)}
          aria-controls={getPanelId(tab)}
          aria-label={`View: ${tab}`}
          aria-selected={activeTab === tab}
          tabIndex={activeTab === tab ? 0 : -1}
        >
          {tab}
        </UnstyledButton>
      ))}
    </Box>
  );
};

export const ContentArea: React.FC<ContentAreaProps> = ({
  activeTab,
  filteredFindings,
}) => {
  return (
    <Box
      className="content-area"
      role="tabpanel"
      id={getPanelId(activeTab)}
      aria-labelledby={getTabId(activeTab)}
    >
      {activeTab === "TABLE" && <FindingsTable findings={filteredFindings} />}
      {activeTab === "JSON" && (
        <MatrixEditor
          value={serializeJSON(filteredFindings)}
          language="json"
          height="100%"
        />
      )}
      {activeTab === "YAML" && (
        <MatrixEditor
          value={serializeYAML(filteredFindings)}
          language="yaml"
          height="100%"
        />
      )}
      {activeTab === "TOON" && (
        <MatrixEditor
          value={serializeTOON(filteredFindings)}
          language="plaintext"
          height="100%"
        />
      )}
    </Box>
  );
};
