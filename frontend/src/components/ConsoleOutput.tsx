"use client";

import { useEffect, useRef } from "react";
import { Card, Title, ScrollArea } from "@mantine/core";
import { IconTerminal } from "@tabler/icons-react";

interface ConsoleMessage {
  type: string;
  message: string;
  timestamp: string;
  tool?: string;
  status?: string;
  errors?: number;
  warnings?: number;
}

interface Props {
  messages: ConsoleMessage[];
}

export default function ConsoleOutput({ messages }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageClass = (type: string, status?: string) => {
    if (type === "error") return "console-output__line--error";
    if (type === "complete" && status === "PASSED")
      return "console-output__line--success";
    if (type === "complete" && status === "FAILED")
      return "console-output__line--error";
    if (type === "phase") return "console-output__line--info";
    if (type === "tool_complete" && status === "PASSED")
      return "console-output__line--success";
    if (type === "tool_complete" && status === "FAILED")
      return "console-output__line--warning";
    return "console-output__line--default";
  };

  return (
    <Card className="console-output" padding="lg">
      <div className="console-output__header">
        <IconTerminal size={20} color="#00ff41" />
        <Title order={3} className="console-output__title" size="h4">
          System Console
        </Title>
      </div>

      <ScrollArea
        className="console-output__scroll-area"
        viewportRef={scrollRef}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`console-output__line ${getMessageClass(
              msg.type,
              msg.status,
            )}`}
          >
            <span style={{ opacity: 0.5 }}>
              [{new Date(msg.timestamp).toLocaleTimeString()}]
            </span>{" "}
            {msg.message}
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
}
