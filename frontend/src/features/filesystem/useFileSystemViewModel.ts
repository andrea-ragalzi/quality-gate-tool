import { useState, useEffect, useCallback } from "react";
import { FilesystemRepository } from "./repository";
import { FileSystemItem } from "./types";

export const useFileSystemViewModel = (initialPath: string) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Repository instance (could be memoized or injected)
  const repository = new FilesystemRepository();

  const loadDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repository.listDirectory(path);
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("ACCESS DENIED: Could not read directory.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  const navigate = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    setCurrentPath(parentPath);
  };

  const refresh = () => {
    loadDirectory(currentPath);
  };

  return {
    currentPath,
    items,
    isLoading,
    error,
    navigate,
    navigateUp,
    refresh,
  };
};
