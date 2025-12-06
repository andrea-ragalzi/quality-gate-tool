import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilesystemRepository } from "./repository";

const globalFetch = (global.fetch = vi.fn());

describe("FilesystemRepository (Integration)", () => {
  let repository: FilesystemRepository;

  beforeEach(() => {
    repository = new FilesystemRepository("http://api.test");
    vi.clearAllMocks();
  });

  it("should fetch directory listing", async () => {
    const mockResponse = {
      path: "/path",
      directories: [
        {
          name: "file1.txt",
          path: "/path/file1.txt",
          is_dir: false,
          size: 100,
          modified: 0,
        },
        {
          name: "dir1",
          path: "/path/dir1",
          is_dir: true,
          size: 0,
          modified: 0,
        },
      ],
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await repository.listDirectory("/path");

    expect(globalFetch).toHaveBeenCalledWith(
      "http://api.test/api/v1/fs/list",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ path: "/path" }),
      }),
    );

    expect(result).toEqual([
      {
        name: "file1.txt",
        path: "/path/file1.txt",
        isDirectory: false,
        size: 100,
        modified: 0,
      },
      {
        name: "dir1",
        path: "/path/dir1",
        isDirectory: true,
        size: 0,
        modified: 0,
      },
    ]);
  });

  it("should handle API errors", async () => {
    globalFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(repository.listDirectory("/bad/path")).rejects.toThrow(
      "Failed to list directory: Not Found",
    );
  });

  it("should map backend fields correctly (Mapping Bug Prevention)", async () => {
    // Backend returns 'is_dir', Frontend expects 'isDirectory'
    const mockResponse = {
      path: "/path",
      directories: [
        {
          name: "file1.txt",
          path: "/path/file1.txt",
          is_dir: false,
          size: 100,
          modified: 0,
        },
      ],
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await repository.listDirectory("/path");

    expect(result[0]).toHaveProperty("isDirectory", false);
    expect(result[0]).not.toHaveProperty("is_dir");
  });

  it("should filter system files (Filtering Bug Prevention)", async () => {
    const mockResponse = {
      path: "/path",
      directories: [
        {
          name: "file1.txt",
          path: "/path/file1.txt",
          is_dir: false,
          size: 100,
          modified: 0,
        },
        {
          name: ".git",
          path: "/path/.git",
          is_dir: true,
          size: 0,
          modified: 0,
        },
        {
          name: ".DS_Store",
          path: "/path/.DS_Store",
          is_dir: false,
          size: 100,
          modified: 0,
        },
        {
          name: "node_modules",
          path: "/path/node_modules",
          is_dir: true,
          size: 0,
          modified: 0,
        },
      ],
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await repository.listDirectory("/path");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("file1.txt");
  });
});
