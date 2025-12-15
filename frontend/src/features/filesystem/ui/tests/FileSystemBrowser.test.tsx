import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import FileSystemBrowser from "@/features/filesystem/ui/FileSystemBrowser";
import * as useFileSystemViewModelModule from "../../model/useFileSystemViewModel";

vi.mock("../../model/useFileSystemViewModel");

// Mock matchMedia for Mantine
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("FileSystemBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render directories from ViewModel", () => {
    const mockItems = [
      {
        name: "folder1",
        path: "/test/path/folder1",
        type: "directory",
        size: 0,
        isDirectory: true,
        modified: Date.now(),
      },
      {
        name: "folder2",
        path: "/test/path/folder2",
        type: "directory",
        size: 0,
        isDirectory: true,
        modified: Date.now(),
      },
    ];

    vi.spyOn(
      useFileSystemViewModelModule,
      "useFileSystemViewModel",
    ).mockReturnValue({
      currentPath: "/test/path",
      items: mockItems,
      isLoading: false,
      error: null,
      navigate: vi.fn(),
      navigateUp: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      <MantineProvider>
        <FileSystemBrowser
          initialPath="/test/path"
          onSelect={() => {}}
          onClose={() => {}}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("folder1")).toBeDefined();
    expect(screen.getByText("folder2")).toBeDefined();
  });

  it("should show error message", () => {
    vi.spyOn(
      useFileSystemViewModelModule,
      "useFileSystemViewModel",
    ).mockReturnValue({
      currentPath: "/test/path",
      items: [],
      isLoading: false,
      error: "Failed to load",
      navigate: vi.fn(),
      navigateUp: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      <MantineProvider>
        <FileSystemBrowser
          initialPath="/test/path"
          onSelect={() => {}}
          onClose={() => {}}
        />
      </MantineProvider>,
    );

    expect(screen.getByText(/Failed to load/i)).toBeDefined();
  });
});
