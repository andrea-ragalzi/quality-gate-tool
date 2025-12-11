import React, { useState } from "react";
import {
  Tabs,
  Group,
  Button,
  Paper,
  ScrollArea,
  Box,
  Badge,
  Code,
} from "@mantine/core";
import {
  IconTable,
  IconFileText,
  IconBolt,
  IconCopy,
  IconTerminal,
} from "@tabler/icons-react";
import { Finding } from "../types";
import { ModuleLogs } from "@/features/analysis/types";
import ConsoleOutput from "@/components/ConsoleOutput";
import {
  formatDate,
  copyToClipboard,
  serializeTable,
  serializeJSON,
  serializeYAML,
  serializeTOON,
  serializeRAW,
} from "../utils";
import classes from "./MetricsContent.module.css";

interface MetricsContentProps {
  filteredFindings: Finding[];
  matrixGreen: string;
  moduleLogs?: ModuleLogs;
}

export const MetricsContent: React.FC<MetricsContentProps> = ({
  filteredFindings,
  matrixGreen,
  moduleLogs,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>("table");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const consoleMessages = React.useMemo(() => {
    if (!moduleLogs) return [];
    const messages: any[] = [];
    Object.entries(moduleLogs).forEach(([moduleId, logData]) => {
      if (logData?.logs) {
        logData.logs.forEach((logLine) => {
          const match = logLine.match(/^\[(.*?)\] (.*)/);
          if (match) {
            messages.push({
              type: "info",
              timestamp: match[1],
              message: match[2],
              tool: moduleId,
            });
          } else {
            messages.push({
              type: "info",
              timestamp: "",
              message: logLine,
              tool: moduleId,
            });
          }
        });
      }
    });
    return messages;
  }, [moduleLogs]);

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
      case "raw":
        text = serializeRAW(filteredFindings);
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
          <Tabs.Tab value="raw" leftSection={<IconFileText size={16} />}>
            RAW
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<IconTerminal size={16} />}>
            LOGS
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
        <Paper
          p="md"
          style={{
            backgroundColor: "rgba(13, 13, 13, 0.8)", // Matching matrix-black with opacity
            border: `1px solid ${matrixGreen}`,
          }}
        >
          <ScrollArea h="calc(100vh - 200px)">
            <Box style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: matrixGreen,
                }}
                className="dashboard__panel-text"
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: `2px solid ${matrixGreen}`,
                      textAlign: "left",
                      position: "sticky",
                      top: 0,
                      backgroundColor: "rgba(13, 13, 13, 1)",
                      zIndex: 1,
                    }}
                  >
                    <th style={{ padding: "8px" }}>TYPE</th>
                    <th style={{ padding: "8px" }}>TOOL</th>
                    <th style={{ padding: "8px" }}>LINE</th>
                    <th style={{ padding: "8px" }}>FILEPATH</th>
                    <th style={{ padding: "8px" }}>MESSAGE</th>
                    <th style={{ padding: "8px" }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFindings.map((finding, index) => (
                    <tr
                      key={finding.id}
                      style={{
                        borderBottom: "1px solid rgba(0, 255, 65, 0.3)",
                        backgroundColor:
                          index % 2 === 0
                            ? "rgba(255, 255, 255, 0.03)"
                            : "transparent",
                      }}
                    >
                      <td style={{ padding: "8px" }}>
                        <Badge
                          variant="outline"
                          color={
                            finding.type === "Error"
                              ? "red"
                              : finding.type === "Warning"
                                ? "yellow"
                                : "blue"
                          }
                          style={{ fontFamily: "monospace" }}
                        >
                          {finding.type}
                        </Badge>
                      </td>
                      <td style={{ padding: "8px" }}>
                        <Badge
                          variant="light"
                          color="gray"
                          style={{
                            fontFamily: "monospace",
                            color: matrixGreen,
                          }}
                        >
                          {finding.tool}
                        </Badge>
                      </td>
                      <td style={{ padding: "8px" }}>{finding.line}</td>
                      <td
                        style={{
                          padding: "8px",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={finding.filepath}
                      >
                        {finding.filepath}
                      </td>
                      <td style={{ padding: "8px" }}>{finding.message}</td>
                      <td style={{ padding: "8px" }}>
                        {formatDate(finding.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </ScrollArea>
        </Paper>
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

      <Tabs.Panel value="raw">
        <Code
          block
          style={{
            backgroundColor: "#000",
            color: matrixGreen,
            border: `1px solid ${matrixGreen}`,
            minHeight: "calc(100vh - 200px)",
          }}
        >
          {serializeRAW(filteredFindings)}
        </Code>
      </Tabs.Panel>

      <Tabs.Panel value="logs">
        {moduleLogs && Object.keys(moduleLogs).length > 0 ? (
          <ConsoleOutput messages={consoleMessages} />
        ) : (
          <Paper
            p="xl"
            style={{
              textAlign: "center",
              backgroundColor: "transparent",
              color: matrixGreen,
            }}
          >
            No logs available
          </Paper>
        )}
      </Tabs.Panel>
    </Tabs>
  );
};
