import React, { useState, useCallback } from "react";
import { Tabs, Group, Button, Text } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import {
  IconTable,
  IconFileText,
  IconBolt,
  IconCopy,
  IconTerminal,
  IconDeviceTv,
} from "@tabler/icons-react";
import { Finding } from "../model/types";
import { useMetricsStats } from "../model/useMetricsStats";
import { useUIStore, Sparkline, MatrixEditor } from "@/shared";
import {
  copyToClipboard,
  serializeTable,
  serializeJSON,
  serializeYAML,
  serializeTOON,
  formatRelativeTime,
} from "../utils";
import { DataGrid } from "./DataGrid";

// ==========================================
// TYPES
// ==========================================

interface MetricsContentProps {
  filteredFindings: Finding[];
}

type TabValue = "table" | "json" | "yaml" | "toon";

// ==========================================
// PURE FUNCTIONS
// ==========================================

function serializeByFormat(findings: Finding[], format: string): string {
  switch (format) {
    case "table":
      return serializeTable(findings);
    case "json":
      return serializeJSON(findings);
    case "yaml":
      return serializeYAML(findings);
    case "toon":
      return serializeTOON(findings);
    default:
      return serializeTable(findings);
  }
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface KPISummaryProps {
  totalErrors: number;
  totalWarnings: number;
  lastFinding: number | null;
  trendData: number[];
}

const KPISummary: React.FC<KPISummaryProps> = ({
  totalErrors,
  totalWarnings,
  lastFinding,
  trendData,
}) => (
  <Group mb="lg" gap="xl" className="metrics-kpi">
    <Group gap="xs">
      <Text size="xl" fw={900} className="metrics-kpi__value">
        TOTAL ERRORS: {totalErrors}
      </Text>
      {trendData.length > 0 && (
        <Sparkline
          data={trendData}
          width={60}
          height={20}
          color="var(--matrix-green)"
        />
      )}
    </Group>
    <Text size="xl" fw={900} className="metrics-kpi__value">
      WARNINGS: {totalWarnings}
    </Text>
    {lastFinding && (
      <Text size="xl" fw={900} className="metrics-kpi__value">
        LAST RUN: {formatRelativeTime(lastFinding).toUpperCase()}
      </Text>
    )}
  </Group>
);

interface ActionButtonsProps {
  activeTab: string;
  copyStatus: string | null;
  onCopy: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  activeTab,
  copyStatus,
  onCopy,
}) => (
  <Group>
    <Button
      leftSection={<IconDeviceTv size={16} />}
      onClick={() => useUIStore.getState().toggleCrt()}
      variant="outline"
      color="green"
      className="metrics-action__btn metrics-action__btn--outline"
    >
      TOGGLE CRT
    </Button>
    <Button
      leftSection={<IconCopy size={16} />}
      onClick={onCopy}
      variant="filled"
      color="green"
      c="black"
      className="metrics-action__btn metrics-action__btn--filled"
    >
      {copyStatus || `COPY ${activeTab.toUpperCase()} DATA`}
    </Button>
  </Group>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const MetricsContent: React.FC<MetricsContentProps> = ({
  filteredFindings,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>("table");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Use extracted hook for stats calculation
  const stats = useMetricsStats({ findings: filteredFindings });

  const handleCopy = useCallback(() => {
    const format = activeTab || "table";
    const text = serializeByFormat(filteredFindings, format);

    copyToClipboard(text, () => {
      setCopyStatus("COPIED!");
      Notifications.show({
        title: "SYSTEM NOTIFICATION",
        message: `> Data copied to buffer [${format.toUpperCase()}]_`,
        color: "green",
        icon: <IconTerminal size={16} />,
        className: "metrics-notification",
      });
      setTimeout(() => setCopyStatus(null), 2000);
    });
  }, [activeTab, filteredFindings]);

  return (
    <Tabs
      value={activeTab}
      onChange={setActiveTab}
      variant="outline"
      className="metrics-tabs"
    >
      <KPISummary
        totalErrors={stats.totalErrors}
        totalWarnings={stats.totalWarnings}
        lastFinding={stats.lastFinding}
        trendData={stats.trendData}
      />

      <Group justify="space-between" mb="md" align="center">
        <Tabs.List>
          <Tabs.Tab value="table" leftSection={<IconTable size={16} />}>
            TABLE
          </Tabs.Tab>
          <Tabs.Tab value="json" leftSection={<IconFileText size={16} />}>
            JSON
          </Tabs.Tab>
          <Tabs.Tab value="yaml" leftSection={<IconFileText size={16} />}>
            YAML
          </Tabs.Tab>
          <Tabs.Tab value="toon" leftSection={<IconBolt size={16} />}>
            TOON
          </Tabs.Tab>
        </Tabs.List>

        <ActionButtons
          activeTab={activeTab || "table"}
          copyStatus={copyStatus}
          onCopy={handleCopy}
        />
      </Group>

      <Tabs.Panel value="table">
        <DataGrid data={filteredFindings} />
      </Tabs.Panel>

      <Tabs.Panel value="json">
        <MatrixEditor value={serializeJSON(filteredFindings)} language="json" />
      </Tabs.Panel>

      <Tabs.Panel value="yaml">
        <MatrixEditor value={serializeYAML(filteredFindings)} language="yaml" />
      </Tabs.Panel>

      <Tabs.Panel value="toon">
        <MatrixEditor
          value={serializeTOON(filteredFindings)}
          language="plaintext"
        />
      </Tabs.Panel>
    </Tabs>
  );
};
