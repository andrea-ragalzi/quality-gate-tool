import React from "react";
import {
  Stack,
  Group,
  Text,
  MultiSelect,
  Select,
  TextInput,
} from "@mantine/core";
import {
  IconFilter,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { METRIC_TYPES, DateRange } from "../types";

interface MetricsFilterSidebarProps {
  availableTools: string[];
  selectedTools: string[];
  setSelectedTools: (val: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (val: string[]) => void;
  sortOrder: string;
  setSortOrder: (val: string) => void;
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
  sortOrder,
  setSortOrder,
  dateRange,
  setDateRange,
  matrixGreen,
  matrixDark,
}) => {
  return (
    <Stack gap="lg">
      <Group>
        <IconFilter size={20} color={matrixGreen} />
        <Text
          className="dashboard__panel-title"
          style={{ fontSize: "1rem", marginBottom: 0 }}
        >
          FILTERS
        </Text>
      </Group>

      <MultiSelect
        label={
          <Text c={matrixGreen} size="sm" fw={700}>
            TOOLS
          </Text>
        }
        placeholder="Select tools"
        data={availableTools}
        value={selectedTools}
        onChange={setSelectedTools}
        classNames={{ input: "dashboard__input" }}
        styles={{
          input: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: matrixGreen,
            borderColor: matrixGreen,
          },
          dropdown: {
            backgroundColor: matrixDark,
            borderColor: matrixGreen,
          },
          option: {
            color: matrixGreen,
            "&:hover": { backgroundColor: "rgba(0, 255, 65, 0.2)" },
          },
        }}
      />

      <MultiSelect
        label={
          <Text c={matrixGreen} size="sm" fw={700}>
            TYPE
          </Text>
        }
        placeholder="Select type"
        data={METRIC_TYPES}
        value={selectedTypes}
        onChange={setSelectedTypes}
        classNames={{ input: "dashboard__input" }}
        styles={{
          input: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: matrixGreen,
            borderColor: matrixGreen,
          },
          dropdown: {
            backgroundColor: matrixDark,
            borderColor: matrixGreen,
          },
          option: {
            color: matrixGreen,
            "&:hover": { backgroundColor: "rgba(0, 255, 65, 0.2)" },
          },
        }}
      />

      <Select
        label={
          <Text c={matrixGreen} size="sm" fw={700}>
            SORT ORDER
          </Text>
        }
        data={[
          { value: "type_desc", label: "Type (Error -> Info)" },
          { value: "type_asc", label: "Type (Info -> Error)" },
          { value: "newest", label: "Newest First" },
          { value: "oldest", label: "Oldest First" },
        ]}
        value={sortOrder}
        onChange={(val) => setSortOrder(val || "type_desc")}
        leftSection={
          sortOrder.includes("asc") ? (
            <IconSortAscending size={16} color={matrixGreen} />
          ) : (
            <IconSortDescending size={16} color={matrixGreen} />
          )
        }
        classNames={{ input: "dashboard__input" }}
        styles={{
          input: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: matrixGreen,
            borderColor: matrixGreen,
          },
          dropdown: {
            backgroundColor: matrixDark,
            borderColor: matrixGreen,
          },
          option: {
            color: matrixGreen,
            "&:hover": { backgroundColor: "rgba(0, 255, 65, 0.2)" },
          },
        }}
      />

      <Stack gap="xs">
        <Text size="sm" c={matrixGreen} fw={700}>
          TIMESTAMP RANGE
        </Text>
        <Group grow>
          <TextInput
            type="date"
            value={dateRange.start || ""}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            classNames={{ input: "dashboard__input" }}
            styles={{
              input: {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: matrixGreen,
                borderColor: matrixGreen,
                colorScheme: "dark",
              },
            }}
          />
          <TextInput
            type="date"
            value={dateRange.end || ""}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            classNames={{ input: "dashboard__input" }}
            styles={{
              input: {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: matrixGreen,
                borderColor: matrixGreen,
                colorScheme: "dark",
              },
            }}
          />
        </Group>
      </Stack>
    </Stack>
  );
};
