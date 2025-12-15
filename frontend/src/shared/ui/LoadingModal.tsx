"use client";

import { Modal, Stack, Text, Loader } from "@mantine/core";

export interface LoadingModalProps {
  opened: boolean;
  title?: string;
  message?: string;
}

export default function LoadingModal({
  opened,
  title = "Loading...",
  message,
}: LoadingModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={() => {}} // Non closable
      withCloseButton={false}
      centered
      size="md"
      classNames={{
        content: "loading-modal__content",
        header: "loading-modal__header",
        body: "loading-modal__body",
      }}
    >
      <Stack align="center" gap="xl">
        <Loader
          size="xl"
          color="green"
          type="dots"
          className="loading-modal__loader"
        />
        <Stack gap="xs" align="center">
          <Text size="xl" fw={700} className="loading-modal__title">
            {title}
          </Text>
          {message && (
            <Text size="sm" className="loading-modal__message">
              {message}
            </Text>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
