"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Group,
  Loader,
  SimpleGrid,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconFolder,
  IconArrowUp,
  IconX,
  IconTerminal,
  IconDeviceFloppy,
  IconFile,
} from "@tabler/icons-react";
import { useFileSystemViewModel } from "../model";

interface FileSystem3DProps {
  initialPath: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function FileSystem3D({
  initialPath,
  onSelect,
  onClose,
}: FileSystem3DProps) {
  const { currentPath, items, isLoading, error, navigate, navigateUp } =
    useFileSystemViewModel(initialPath);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleNavigate = (dirName: string) => {
    const newPath =
      currentPath === "/" ? `/${dirName}` : `${currentPath}/${dirName}`;
    navigate(newPath);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box className="file-system">
      <Box component="canvas" ref={canvasRef} className="file-system__canvas" />

      <Box component="header" className="file-system__header">
        <Group gap="sm" className="file-system__title-group">
          <IconTerminal size={24} />
          <Title order={1} className="file-system__title">
            SYSTEM_ROOT_ACCESS // FILE_EXPLORER
          </Title>
        </Group>
        <Button
          variant="subtle"
          color="red"
          leftSection={<IconX size={16} />}
          onClick={onClose}
          className="file-system__close-btn"
        >
          CLOSE_CONNECTION
        </Button>
      </Box>

      <Box className="file-system__content">
        <Box className="file-system__path-container">
          <Text className="file-system__path-label">CURRENT_DIRECTORY</Text>
          <Text className="file-system__path-value">
            <Text component="span">{">"}</Text> {currentPath}
          </Text>

          <Group gap="sm" className="file-system__actions">
            <Button
              variant="outline"
              color="cyan"
              leftSection={<IconArrowUp size={18} />}
              onClick={navigateUp}
              disabled={currentPath === "/" || currentPath === "/home"}
              className="file-system__btn file-system__btn--up"
            >
              UP_LEVEL
            </Button>

            <Button
              variant="filled"
              color="green"
              leftSection={<IconDeviceFloppy size={18} />}
              onClick={() => onSelect(currentPath)}
              className="file-system__btn file-system__btn--select"
            >
              SELECT_THIS_PROJECT
            </Button>
          </Group>
        </Box>

        <Box className="file-system__grid-container">
          {isLoading ? (
            <Group justify="center" p="xl">
              <Loader color="green" type="dots" />
              <Text c="green">SCANNING_FILESYSTEM...</Text>
            </Group>
          ) : error ? (
            <Text c="red" className="file-system__error">
              {error}
            </Text>
          ) : (
            <SimpleGrid
              cols={{ base: 2, sm: 3, md: 4, lg: 6 }}
              spacing="sm"
              className="file-system__grid"
            >
              {items.map((item) => (
                <UnstyledButton
                  key={item.name}
                  onClick={() => item.isDirectory && handleNavigate(item.name)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`file-system__item ${
                    hoveredItem === item.name ? "file-system__item--active" : ""
                  }
                                        ${
                                          !item.isDirectory
                                            ? "opacity-50 cursor-default"
                                            : ""
                                        }`}
                  type="button"
                >
                  {item.isDirectory ? (
                    <IconFolder className="file-system__icon" size={24} />
                  ) : (
                    <IconFile className="file-system__icon" size={24} />
                  )}
                  <Text size="sm" className="file-system__item-name">
                    {item.name}
                  </Text>
                  {item.isDirectory && (
                    <Text
                      size="xs"
                      c="dimmed"
                      className="file-system__enter-hint"
                    >
                      [ENTER]
                    </Text>
                  )}
                </UnstyledButton>
              ))}
              {items.length === 0 && (
                <Text c="dimmed" className="file-system__empty">
                  NO_FILES_FOUND
                </Text>
              )}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      <Group
        component="footer"
        justify="space-between"
        className="file-system__footer"
      >
        <Text size="xs">STATUS: CONNECTED</Text>
        <Text size="xs">ITEMS: {items.length}</Text>
        <Text size="xs">PROTOCOL: LOCAL_FS</Text>
      </Group>
    </Box>
  );
}
