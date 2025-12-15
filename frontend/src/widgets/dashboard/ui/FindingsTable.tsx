import React from "react";
import { FindingsTableProps } from "../model/types";
import { getSeverityInfo } from "../lib";

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>SEVERITY</th>
          <th>TOOL</th>
          <th>FILE</th>
          <th>MESSAGE</th>
          <th>LINE</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((finding) => {
          const { className, label } = getSeverityInfo(finding.type);
          return (
            <tr key={finding.id}>
              <td className={className}>{label}</td>
              <td>{finding.tool}</td>
              <td>{finding.filepath}</td>
              <td>{finding.message}</td>
              <td>{finding.line}</td>
            </tr>
          );
        })}
        {findings.length === 0 && (
          <tr>
            <td colSpan={5} style={{ textAlign: "center", opacity: 0.5 }}>
              No findings to display
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
