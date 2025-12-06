"use client";

import { Modal, Text, ScrollArea } from "@mantine/core";

interface LogModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  logContent: string;
}

export default function LogModal({
  opened,
  onClose,
  title,
  logContent,
}: LogModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text
          className="log-modal__title glitch"
          size="xl"
          fw={900}
          data-text={title}
        >
          {title}
        </Text>
      }
      size="xl"
      centered
      classNames={{
        overlay: "log-modal__overlay",
        content: "log-modal__content",
        header: "log-modal__header",
        body: "log-modal__body",
      }}
    >
      <ScrollArea h={500} type="auto">
        <pre className="log-modal__pre">
          {logContent || "Nessun log disponibile."}
        </pre>
      </ScrollArea>
    </Modal>
  );
}
