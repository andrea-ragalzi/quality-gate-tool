import { renderHook, act, waitFor } from "@testing-library/react";
import { useFileSystemViewModel } from "./useFileSystemViewModel";
import { FilesystemRepository } from "./repository";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("./repository");

describe("useFileSystemViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load directory on mount", async () => {
    const mockItems = [
      { name: "file.txt", path: "/test/file.txt", type: "file", size: 100 },
    ];
    FilesystemRepository.prototype.listDirectory = vi
      .fn()
      .mockResolvedValue(mockItems);

    const { result } = renderHook(() => useFileSystemViewModel("/test"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItems);
    expect(result.current.currentPath).toBe("/test");
  });

  it("should handle navigation", async () => {
    FilesystemRepository.prototype.listDirectory = vi
      .fn()
      .mockResolvedValue([]);

    const { result } = renderHook(() => useFileSystemViewModel("/test"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.navigate("/new/path");
    });

    expect(result.current.currentPath).toBe("/new/path");
    expect(FilesystemRepository.prototype.listDirectory).toHaveBeenCalledWith(
      "/new/path",
    );
  });

  it("should handle navigate up", async () => {
    FilesystemRepository.prototype.listDirectory = vi
      .fn()
      .mockResolvedValue([]);
    const { result } = renderHook(() => useFileSystemViewModel("/a/b"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.navigateUp();
    });

    expect(result.current.currentPath).toBe("/a");
  });
});
