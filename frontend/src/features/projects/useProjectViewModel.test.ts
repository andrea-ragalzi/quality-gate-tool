import { renderHook, act, waitFor } from "@testing-library/react";
import { useProjectViewModel } from "./useProjectViewModel";
import { ProjectRepository } from "./repository";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("./repository");

describe("useProjectViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load projects on mount", async () => {
    const mockProjects = [{ name: "Test", path: "/test", id: "test" }];
    ProjectRepository.prototype.listProjects = vi
      .fn()
      .mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjectViewModel());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockProjects);
  });

  it("should handle create project", async () => {
    ProjectRepository.prototype.listProjects = vi.fn().mockResolvedValue([]);
    ProjectRepository.prototype.createProject = vi
      .fn()
      .mockResolvedValue({ name: "New", path: "/new", id: "new" });

    const { result } = renderHook(() => useProjectViewModel());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createProject("New", "/new");
    });

    expect(ProjectRepository.prototype.createProject).toHaveBeenCalledWith(
      "New",
      "/new",
    );
    expect(ProjectRepository.prototype.listProjects).toHaveBeenCalledTimes(2); // Initial + after create
  });
});
