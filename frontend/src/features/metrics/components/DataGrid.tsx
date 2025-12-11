import React, { useState, useMemo } from "react";
import { Box, TextInput } from "@mantine/core";
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
} from "@tabler/icons-react";
import { Finding } from "../types";
import { formatDate } from "../utils";

interface DataGridProps {
  data: Finding[];
}

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: keyof Finding | null;
  direction: SortDirection;
}

export const DataGrid: React.FC<DataGridProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleSort = (key: keyof Finding) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const sortedAndFilteredData = useMemo(() => {
    let processedData = [...data];

    // Filtering
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key].toLowerCase();
      if (filterValue) {
        processedData = processedData.filter((item) => {
          const itemValue = String(
            item[key as keyof Finding] || "",
          ).toLowerCase();
          return itemValue.includes(filterValue);
        });
      }
    });

    // Sorting
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Finding];
        const bValue = b[sortConfig.key as keyof Finding];

        if (aValue === bValue) return 0;

        // Handle null/undefined
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return processedData;
  }, [data, sortConfig, filters]);

  const getSortIcon = (key: keyof Finding) => {
    if (sortConfig.key !== key) {
      return <IconSelector size={14} className="data-grid__sort-icon" />;
    }
    return sortConfig.direction === "asc" ? (
      <IconChevronUp size={14} className="data-grid__sort-icon" />
    ) : (
      <IconChevronDown size={14} className="data-grid__sort-icon" />
    );
  };

  const columns: { key: keyof Finding; label: string; width?: string }[] = [
    { key: "type", label: "Type", width: "100px" },
    { key: "tool", label: "Tool", width: "120px" },
    { key: "line", label: "Line", width: "80px" },
    { key: "filepath", label: "Filepath" },
    { key: "message", label: "Message" },
    { key: "timestamp", label: "Timestamp", width: "180px" },
  ];

  const getStatusClass = (type: string) => {
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
  };

  return (
    <Box className="data-grid__container">
      <table className="data-grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                onClick={() => handleSort(col.key)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{col.label}</span>
                  {getSortIcon(col.key)}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder={`Filter ${col.label}...`}
                    className="data-grid__filter-input"
                    value={filters[col.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(col.key, e.target.value)
                    }
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredData.length > 0 ? (
            sortedAndFilteredData.map((finding) => (
              <tr key={finding.id}>
                <td
                  className={`data-grid__status ${getStatusClass(
                    finding.type,
                  )}`}
                >
                  {finding.type}
                </td>
                <td>{finding.tool}</td>
                <td>{finding.line}</td>
                <td
                  title={finding.filepath}
                  style={{
                    maxWidth: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {finding.filepath}
                </td>
                <td>{finding.message}</td>
                <td>{formatDate(finding.timestamp)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: "2rem" }}
              >
                No findings match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Box>
  );
};
