import { describe, it, expect } from "vitest";
import { parseFindingsFromLogs } from "../logParser";

describe("logParser", () => {
  it("should parse standard error format", () => {
    const log = "src/index.ts:10:5: error TS1234: Some error";
    const findings = parseFindingsFromLogs("F_TypeScript", log);
    expect(findings).toHaveLength(1);
    expect(findings[0].filepath).toBe("src/index.ts");
    expect(findings[0].line).toBe(10);
    expect(findings[0].message).toContain("error TS1234: Some error");
  });

  it("should ignore system log lines", () => {
    const log = `
[10:56:04 PM] $ npx eslint ...
[10:56:03 PM] ⚠️ Source directory not found
src/app.ts:5:1: warning: Some warning
        `;
    const findings = parseFindingsFromLogs("F_ESLint", log);
    expect(findings).toHaveLength(1);
    expect(findings[0].filepath).toBe("src/app.ts");
  });

  it("should parse JSON output", () => {
    const jsonLog = JSON.stringify([
      {
        filePath: "src/file.js",
        messages: [
          { line: 1, severity: 2, message: "Error msg", ruleId: "rule-1" },
        ],
      },
    ]);
    const findings = parseFindingsFromLogs("F_ESLint", jsonLog);
    expect(findings).toHaveLength(1);
    expect(findings[0].filepath).toBe("src/file.js");
    expect(findings[0].type).toBe("Error");
  });
});
