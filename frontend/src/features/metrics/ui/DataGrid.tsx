import React from "react";
import {
  Box,
  Tooltip,
  Switch,
  Group,
  Text,
  Badge,
  Modal,
  Button,
  Code,
  ScrollArea,
  Table,
  TextInput,
} from "@mantine/core";
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconEye,
  IconAlertTriangle,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";
import { Finding } from "../model/types";
import { formatDate, formatRelativeTime } from "../utils";
import {
  useDataGrid,
  ClusteredFinding,
  SortConfig,
} from "../model/useDataGrid";

// ==========================================
// TYPES
// ==========================================

interface DataGridProps {
  data: Finding[];
}

interface ColumnConfig {
  key: keyof Finding;
  label: string;
  width?: string;
}

// ==========================================
// PURE FUNCTIONS (UI Helpers)
// ==========================================

const COLUMNS: ColumnConfig[] = [
  { key: "type", label: "Type", width: "100px" },
  { key: "tool", label: "Tool", width: "120px" },
  { key: "line", label: "Line", width: "80px" },
  { key: "filepath", label: "Filepath" },
  { key: "message", label: "Message" },
  { key: "timestamp", label: "Timestamp", width: "180px" },
];

function getStatusIcon(type: string): React.ReactNode {
  switch (type.toLowerCase()) {
    case "error":
      return <IconX size={14} />;
    case "warning":
      return <IconAlertTriangle size={14} />;
    case "info":
      return <IconInfoCircle size={14} />;
    default:
      return null;
  }
}

function getStatusClass(type: string): string {
  switch (type.toLowerCase()) {
    case "error":
      return "data-grid__status--error";
    case "warning":
      return "data-grid__status--warning";
    case "info":
      return "data-grid__status--info";
    case "complexity":
      return "data-grid__status--complexity";
    default:
      return "";
  }
}

function getSortIcon(
  sortConfig: SortConfig,
  key: keyof Finding,
): React.ReactNode {
  if (sortConfig.key !== key) {
    return <IconSelector size={14} className="data-grid__sort-icon" />;
  }
  return sortConfig.direction === "asc" ? (
    <IconChevronUp size={14} className="data-grid__sort-icon" />
  ) : (
    <IconChevronDown size={14} className="data-grid__sort-icon" />
  );
}

function getBadgeColor(type: string): string {
  switch (type) {
    case "Error":
      return "red";
    case "Warning":
      return "yellow";
    default:
      return "blue";
  }
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface HeaderCellProps {
  column: ColumnConfig;
  sortConfig: SortConfig;
  filterValue: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSort: (key: keyof Finding) => void;
  onFilterChange: (key: string, value: string) => void;
}

const HeaderCell: React.FC<HeaderCellProps> = ({
  column,
  sortConfig,
  filterValue,
  searchInputRef,
  onSort,
  onFilterChange,
}) => (
  <Table.Th
    className={column.key === "expand" ? "data-grid__th--expand" : undefined}
    style={column.width ? { width: column.width } : undefined}
    onClick={() => onSort(column.key)}
  >
    <Box className="data-grid__header-content">
      <Text>{column.label}</Text>
      {getSortIcon(sortConfig, column.key)}
    </Box>
    <Box onClick={(e) => e.stopPropagation()}>
      <TextInput
        ref={column.key === "message" ? searchInputRef : undefined}
        placeholder={`Filter ${column.label}...`}
        className="data-grid__filter-input"
        value={filterValue}
        onChange={(e) => onFilterChange(column.key, e.target.value)}
      />
    </Box>
  </Table.Th>
);

interface FindingRowProps {
  finding: ClusteredFinding;
  index: number;
  onExpand: (finding: Finding) => void;
}

const FindingRow: React.FC<FindingRowProps> = ({
  finding,
  index,
  onExpand,
}) => (
  <Table.Tr
    key={finding.id || index}
    className={`data-grid__row data-grid__row--${finding.type.toLowerCase()}`}
  >
    <Table.Td className="data-grid__cell--center">
      <Button
        variant="subtle"
        size="compact-xs"
        color="gray"
        onClick={() => onExpand(finding)}
      >
        <IconEye size={16} />
      </Button>
    </Table.Td>
    <Table.Td className={`data-grid__status ${getStatusClass(finding.type)}`}>
      <Group gap={4}>
        {getStatusIcon(finding.type)}
        {finding.type}
        {finding.count && finding.count > 1 && (
          <Badge
            size="xs"
            variant="filled"
            color="gray"
            circle
            className="data-grid__count-badge"
          >
            {finding.count}
          </Badge>
        )}
      </Group>
    </Table.Td>
    <Table.Td>{finding.tool}</Table.Td>
    <Table.Td>{finding.line}</Table.Td>
    <Table.Td className="data-grid__cell--truncate">
      <Tooltip label={finding.filepath} openDelay={500}>
        <Text
          component="span"
          className="data-grid__cell-truncate data-grid__cell-truncate--filepath"
        >
          {finding.filepath}
        </Text>
      </Tooltip>
    </Table.Td>
    <Table.Td className="data-grid__cell--truncate">
      <Tooltip label={finding.message} openDelay={500}>
        <Text
          component="span"
          className="data-grid__cell-truncate data-grid__cell-truncate--message"
        >
          {finding.message}
        </Text>
      </Tooltip>
    </Table.Td>
    <Table.Td>
      <Tooltip label={formatDate(finding.timestamp)} openDelay={500}>
        <Text component="span">{formatRelativeTime(finding.timestamp)}</Text>
      </Tooltip>
    </Table.Td>
  </Table.Tr>
);

interface DetailModalProps {
  finding: Finding | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ finding, onClose }) => (
  <Modal
    opened={!!finding}
    onClose={onClose}
    title={
      <Text fw={700} c="var(--matrix-green)">
        Finding Details
      </Text>
    }
    size="lg"
    centered
    className="data-grid__modal"
  >
    {finding && (
      <ScrollArea h={400}>
        <Group mb="md">
          <Badge size="lg" color={getBadgeColor(finding.type)}>
            {finding.type}
          </Badge>
          <Text size="sm" c="dimmed">
            {formatDate(finding.timestamp)}
          </Text>
        </Group>
        <Text fw={700} mb={4}>
          Message:
        </Text>
        <Code block mb="md" color="dark">
          {finding.message}
        </Code>
        <Text fw={700} mb={4}>
          Location:
        </Text>
        <Code block mb="md" color="dark">
          {finding.filepath}:{finding.line}
        </Code>
        <Text fw={700} mb={4}>
          Tool:
        </Text>
        <Text mb="md">{finding.tool}</Text>
        {(finding as ClusteredFinding).count && (
          <Text size="sm" c="dimmed">
            This finding occurred {(finding as ClusteredFinding).count} times in
            the current view.
          </Text>
        )}
      </ScrollArea>
    )}
  </Modal>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const DataGrid: React.FC<DataGridProps> = ({ data }) => {
  const {
    sortConfig,
    filters,
    clusterView,
    expandedFinding,
    searchInputRef,
    processedData,
    handleSort,
    handleFilterChange,
    setClusterView,
    setExpandedFinding,
  } = useDataGrid({ data });

  return (
    <Box>
      <Group mb="md" justify="space-between">
        <Text size="sm" c="dimmed">
          {processedData.length} findings
        </Text>
        <Switch
          label="Cluster View (Group Identical)"
          checked={clusterView}
          onChange={(event) => setClusterView(event.currentTarget.checked)}
          color="green"
          className="data-grid__switch"
        />
      </Group>

      <Box className="data-grid__container">
        <Table className="data-grid" stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="data-grid__th--expand" />
              {COLUMNS.map((col) => (
                <HeaderCell
                  key={col.key}
                  column={col}
                  sortConfig={sortConfig}
                  filterValue={filters[col.key] || ""}
                  searchInputRef={
                    col.key === "message" ? searchInputRef : undefined
                  }
                  onSort={handleSort}
                  onFilterChange={handleFilterChange}
                />
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {processedData.length > 0 ? (
              processedData.map((finding, index) => (
                <FindingRow
                  key={finding.id || index}
                  finding={finding}
                  index={index}
                  onExpand={setExpandedFinding}
                />
              ))
            ) : (
              <Table.Tr>
                <Table.Td
                  colSpan={COLUMNS.length + 1}
                  className="data-grid__empty-row"
                >
                  No findings match your filters.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>

      <DetailModal
        finding={expandedFinding}
        onClose={() => setExpandedFinding(null)}
      />
    </Box>
  );
};
