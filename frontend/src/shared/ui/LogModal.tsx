"use client";

import { Box, Modal, Text, ScrollArea, Button, Group } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";

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
  const handleCopy = () => {
    navigator.clipboard.writeText(logContent);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Text
            className="log-modal__title glitch"
            size="xl"
            fw={900}
            data-text={title}
          >
            {title}
          </Text>
          <Button
            onClick={handleCopy}
            leftSection={<IconCopy size={16} />}
            variant="subtle"
            size="xs"
          >
            Copy
          </Button>
        </Group>
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
        <Box component="pre" className="log-modal__pre">
          {logContent || "Nessun log disponibile."}
        </Box>
      </ScrollArea>
    </Modal>
  );
}
