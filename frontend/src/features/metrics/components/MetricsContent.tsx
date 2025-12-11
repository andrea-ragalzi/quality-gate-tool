import React, { useState } from "react";
import { Tabs, Group, Button, Code } from "@mantine/core";
import {
  IconTable,
  IconFileText,
  IconBolt,
  IconCopy,
} from "@tabler/icons-react";
import { Finding } from "../types";
import {
  copyToClipboard,
  serializeTable,
  serializeJSON,
  serializeYAML,
  serializeTOON,
} from "../utils";
import classes from "./MetricsContent.module.css";
import { DataGrid } from "./DataGrid";

interface MetricsContentProps {
  filteredFindings: Finding[];
  matrixGreen: string;
}

export const MetricsContent: React.FC<MetricsContentProps> = ({
  filteredFindings,
  matrixGreen,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>("table");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (format: string) => {
    let text = "";
    switch (format) {
      case "table":
        text = serializeTable(filteredFindings);
        break;
      case "json":
        text = serializeJSON(filteredFindings);
        break;
      case "yaml":
        text = serializeYAML(filteredFindings);
        break;
      case "toon":
        text = serializeTOON(filteredFindings);
        break;
    }
    copyToClipboard(text, () => {
      setCopyStatus("COPIED!");
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  return (
    <Tabs
      value={activeTab}
      onChange={setActiveTab}
      variant="outline"
      classNames={classes}
      style={{ "--matrix-green": matrixGreen } as React.CSSProperties}
    >
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

        <Button
          leftSection={<IconCopy size={16} />}
          onClick={() => handleCopy(activeTab || "table")}
          variant="outline"
          className={classes.button}
        >
          {copyStatus || `COPY ${activeTab?.toUpperCase()} DATA`}
        </Button>
      </Group>

      <Tabs.Panel value="table">
        <DataGrid data={filteredFindings} />
      </Tabs.Panel>

      <Tabs.Panel value="json">
        <Code
          block
          style={{
            backgroundColor: "#000",
            color: matrixGreen,
            border: `1px solid ${matrixGreen}`,
            minHeight: "calc(100vh - 200px)",
          }}
        >
          {serializeJSON(filteredFindings)}
        </Code>
      </Tabs.Panel>

      <Tabs.Panel value="yaml">
        <Code
          block
          style={{
            backgroundColor: "#000",
            color: matrixGreen,
            border: `1px solid ${matrixGreen}`,
            minHeight: "calc(100vh - 200px)",
          }}
        >
          {serializeYAML(filteredFindings)}
        </Code>
      </Tabs.Panel>

      <Tabs.Panel value="toon">
        <Code
          block
          style={{
            backgroundColor: "#000",
            color: matrixGreen,
            border: `1px solid ${matrixGreen}`,
            minHeight: "calc(100vh - 200px)",
          }}
        >
          {serializeTOON(filteredFindings)}
        </Code>
      </Tabs.Panel>
    </Tabs>
  );
};
