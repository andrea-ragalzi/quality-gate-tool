"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconFolder,
  IconArrowUp,
  IconX,
  IconTerminal,
  IconDeviceFloppy,
  IconFile,
} from "@tabler/icons-react";
import { useFileSystemViewModel } from "@/features/filesystem/useFileSystemViewModel";

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
  // 1. Consume View Model
  const { currentPath, items, isLoading, error, navigate, navigateUp } =
    useFileSystemViewModel(initialPath);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // 2. UI Handlers
  const handleNavigate = (dirName: string) => {
    const newPath =
      currentPath === "/" ? `/${dirName}` : `${currentPath}/${dirName}`;
    navigate(newPath);
  };

  // Matrix Rain Effect (Presentation Logic)
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

  // 3. Render (Dumb Component)
  return (
    <div className="file-system">
      <canvas ref={canvasRef} className="file-system__canvas" />

      <div className="file-system__header">
        <div className="file-system__title-group">
          <IconTerminal size={24} />
          <h1 className="file-system__title">
            SYSTEM_ROOT_ACCESS // FILE_EXPLORER
          </h1>
        </div>
        <button onClick={onClose} className="file-system__close-btn">
          <IconX size={16} /> CLOSE_CONNECTION
        </button>
      </div>

      <div className="file-system__content">
        <div className="file-system__path-container">
          <div className="file-system__path-label">CURRENT_DIRECTORY</div>
          <div className="file-system__path-value">
            <span>{">"}</span> {currentPath}
          </div>

          <div className="file-system__actions">
            <button
              onClick={navigateUp}
              disabled={currentPath === "/" || currentPath === "/home"}
              className="file-system__btn file-system__btn--up"
            >
              <IconArrowUp size={18} /> UP_LEVEL
            </button>

            <button
              onClick={() => onSelect(currentPath)}
              className="file-system__btn file-system__btn--select"
            >
              <IconDeviceFloppy size={18} /> SELECT_THIS_PROJECT
            </button>
          </div>
        </div>

        <div className="file-system__grid-container">
          {isLoading ? (
            <div className="file-system__loading">SCANNING_FILESYSTEM...</div>
          ) : error ? (
            <div className="file-system__error">{error}</div>
          ) : (
            <div className="file-system__grid">
              {items.map((item) => (
                <button
                  key={item.name}
                  onClick={() => item.isDirectory && handleNavigate(item.name)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`file-system__item ${
                    hoveredItem === item.name ? "file-system__item--active" : ""
                  } ${!item.isDirectory ? "opacity-50 cursor-default" : ""}`}
                >
                  {item.isDirectory ? (
                    <IconFolder className="file-system__icon" size={24} />
                  ) : (
                    <IconFile className="file-system__icon" size={24} />
                  )}
                  <span className="file-system__item-name">{item.name}</span>
                  {item.isDirectory && (
                    <div className="file-system__enter-hint">[ENTER]</div>
                  )}
                </button>
              ))}
              {items.length === 0 && (
                <div className="file-system__empty">NO_FILES_FOUND</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="file-system__footer">
        <div>STATUS: CONNECTED</div>
        <div>ITEMS: {items.length}</div>
        <div>PROTOCOL: LOCAL_FS</div>
      </div>
    </div>
  );
}
