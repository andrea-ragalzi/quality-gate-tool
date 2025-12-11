import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FileSystem3D from "../FileSystem3D";
import * as useFileSystemViewModelModule from "@/features/filesystem/useFileSystemViewModel";

// Mock the ViewModel hook
vi.mock("@/features/filesystem/useFileSystemViewModel");

describe("FileSystem3D", () => {
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
        modified: new Date().toISOString(),
      },
      {
        name: "folder2",
        path: "/test/path/folder2",
        type: "directory",
        size: 0,
        isDirectory: true,
        modified: new Date().toISOString(),
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
      <FileSystem3D
        initialPath="/test/path"
        onSelect={() => {}}
        onClose={() => {}}
      />,
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
      <FileSystem3D
        initialPath="/test/path"
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/Failed to load/i)).toBeDefined();
  });
});
