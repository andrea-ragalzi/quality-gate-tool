"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AppShell,
  Burger,
  Group,
  Title,
  Badge,
  Container,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBolt, IconArrowLeft } from "@tabler/icons-react";
import { useMetrics } from "../../features/metrics/hooks/useMetrics";
import { useAnalysisStore } from "@/features/analysis/stores/useAnalysisStore";
import { useTools } from "@/features/analysis/hooks/useTools";
import { MetricsFilterSidebar } from "../../features/metrics/components/MetricsFilterSidebar";
import { MetricsContent } from "../../features/metrics/components/MetricsContent";

export default function MetricsDashboard() {
  const { moduleLogs } = useAnalysisStore();
  const { data: tools = [] } = useTools();

  const {
    filteredFindings,
    selectedTools,
    setSelectedTools,
    selectedTypes,
    setSelectedTypes,
    sortOrder,
    setSortOrder,
    dateRange,
    setDateRange,
  } = useMetrics(moduleLogs, tools);

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  const availableToolNames = useMemo(() => tools.map((t) => t.title), [tools]);

  // --- Styles (Matrix Theme Adaptation) ---
  const matrixGreen = "#00ff41";

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "lg",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      classNames={{
        main: "app-shell__main",
        navbar: "app-shell__aside",
        header: "app-shell__aside",
      }}
    >
      <AppShell.Header
        style={{
          borderBottom: `1px solid ${matrixGreen}`,
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="lg"
              size="sm"
              color={matrixGreen}
            />
            <IconBolt color={matrixGreen} />
            <Title
              order={3}
              className="dashboard__panel-title"
              style={{ margin: 0 }}
            >
              QUALITY GATE METRICS
            </Title>
          </Group>
          <Group>
            <Button
              component={Link}
              href="/"
              variant="outline"
              size="xs"
              leftSection={<IconArrowLeft size={14} />}
              style={{
                color: matrixGreen,
                borderColor: matrixGreen,
                fontFamily: "monospace",
              }}
            >
              BACK
            </Button>
            <Badge
              variant="outline"
              color="green"
              size="lg"
              style={{
                fontFamily: "monospace",
                borderColor: matrixGreen,
                color: matrixGreen,
              }}
            >
              {filteredFindings.length} FINDINGS
            </Badge>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <MetricsFilterSidebar
          availableTools={availableToolNames}
          selectedTools={selectedTools}
          setSelectedTools={setSelectedTools}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          dateRange={dateRange}
          setDateRange={setDateRange}
          matrixGreen={matrixGreen}
          matrixDark="#1a1a1a"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container fluid>
          <MetricsContent
            filteredFindings={filteredFindings}
            matrixGreen={matrixGreen}
            moduleLogs={moduleLogs}
          />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
