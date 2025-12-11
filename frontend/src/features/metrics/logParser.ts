import { Finding } from "./types";

/**
 * Parses raw tool logs into structured Findings.
 * Supports formats from Ruff, ESLint, TypeScript, etc.
 */
export const parseFindingsFromLogs = (
  moduleId: string,
  fullLog: string,
  toolMap?: Record<string, string>,
): Finding[] => {
  const findings: Finding[] = [];
  const toolName =
    toolMap && toolMap[moduleId]
      ? toolMap[moduleId]
      : mapModuleIdToToolName(moduleId);

  // Try parsing as JSON first (for ESLint)
  try {
    // Match JSON array, using [\s\S] for dotAll
    const jsonMatch = fullLog.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const jsonContent = JSON.parse(jsonMatch[0]);
      if (Array.isArray(jsonContent)) {
        jsonContent.forEach((fileResult: any) => {
          const filepath = fileResult.filePath;
          if (fileResult.messages && Array.isArray(fileResult.messages)) {
            fileResult.messages.forEach((msg: any) => {
              findings.push({
                id: `${moduleId}-${filepath}-${msg.line}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                tool: toolName,
                type: msg.severity === 2 ? "Error" : "Warning", // ESLint: 2=Error, 1=Warning
                message: msg.message,
                filepath: filepath,
                line: msg.line,
                ruleId: msg.ruleId,
                timestamp: Date.now(),
              });
            });
          }
        });
        if (findings.length > 0) return findings;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  const lines = fullLog.split("\n");

  // Regex patterns
  const standardPattern = /^(.+?):(\d+):(\d+):\s*(.+)$/;
  const tsPattern = /^(.+?)\((\d+),(\d+)\):\s*(.+)$/;
  const simplePattern = /^(.+?):(\d+):\s*(.+)$/;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Ignore system log lines (starting with timestamp like [10:56:04 PM])
    if (/^\[\d{1,2}:\d{2}:\d{2}\s*[AP]M\]/.test(trimmed)) return;
    // Ignore lines starting with $ (commands)
    if (trimmed.startsWith("$")) return;
    // Ignore lines starting with ⚠️ (warnings from backend)
    if (trimmed.startsWith("⚠️")) return;

    let match = trimmed.match(standardPattern);
    if (match) {
      const [, filepath, lineNum, colNum, content] = match;
      findings.push(
        createFinding(toolName, filepath, parseInt(lineNum), content),
      );
      return;
    }

    match = trimmed.match(tsPattern);
    if (match) {
      const [, filepath, lineNum, colNum, content] = match;
      findings.push(
        createFinding(toolName, filepath, parseInt(lineNum), content),
      );
      return;
    }

    match = trimmed.match(simplePattern);
    if (match) {
      const [, filepath, lineNum, content] = match;
      findings.push(
        createFinding(toolName, filepath, parseInt(lineNum), content),
      );
      return;
    }
  });

  return findings;
};

const mapModuleIdToToolName = (moduleId: string): string => {
  // Fallback: return the moduleId itself if no map is provided.
  // The UI might show "F_TypeScript" instead of "TypeScript", which is acceptable if data is missing.
  return moduleId;
};

const createFinding = (
  tool: Finding["tool"],
  filepath: string,
  line: number,
  content: string,
): Finding => {
  let type: Finding["type"] = "Warning";
  let ruleId: string | undefined;

  const lowerContent = content.toLowerCase();

  if (lowerContent.includes("error") || lowerContent.includes("critical")) {
    type = "Error";
  } else if (
    lowerContent.includes("warning") ||
    lowerContent.includes("warn")
  ) {
    type = "Warning";
  } else if (lowerContent.includes("info") || lowerContent.includes("note")) {
    type = "Info";
  }

  const ruleMatch = content.match(/\b([A-Z]+[0-9]+)\b/);
  if (ruleMatch) {
    ruleId = ruleMatch[1];
  }

  return {
    id: `${tool}-${filepath}-${line}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    tool,
    type,
    message: content,
    filepath,
    line,
    ruleId,
    timestamp: Date.now(),
  };
};
