"use client";

import React, { useEffect } from "react";
import { Box } from "@mantine/core";
import Editor, { useMonaco } from "@monaco-editor/react";

interface MatrixEditorProps {
  value: string;
  language: "json" | "yaml" | "plaintext";
  height?: string;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  value,
  language,
  height = "calc(100vh - 250px)",
}) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("matrix-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "string.key", foreground: "00ff41", fontStyle: "bold" },
          { token: "string.value", foreground: "ccffcc" },
          { token: "number", foreground: "00ff41" },
          { token: "keyword", foreground: "00ff41", fontStyle: "bold" },
          { token: "delimiter", foreground: "008f11" },
        ],
        colors: {
          "editor.background": "#050505",
          "editor.foreground": "#ccffcc",
          "editor.lineHighlightBackground": "#003300",
          "editorCursor.foreground": "#00ff41",
          "editorIndentGuide.background": "#003300",
          "editorIndentGuide.activeBackground": "#00ff41",
        },
      });
      monaco.editor.setTheme("matrix-theme");
    }
  }, [monaco]);

  return (
    <Box className="matrix-editor" style={{ height }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        theme="matrix-theme"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "JetBrains Mono, monospace",
          fontLigatures: true,
          lineNumbers: "on",
          renderLineHighlight: "all",
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "always",
          matchBrackets: "always",
          automaticLayout: true,
        }}
      />
    </Box>
  );
};
