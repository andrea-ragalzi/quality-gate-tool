import { z } from "zod";

export const FileItemSchema = z.object({
  name: z.string(),
  path: z.string(),
  is_dir: z.boolean(),
  size: z.number().default(0),
  modified: z.number().default(0.0),
});

export type FileItem = z.infer<typeof FileItemSchema>;

export const DirectoryListResponseSchema = z.object({
  path: z.string(),
  directories: z.array(FileItemSchema),
});

export type DirectoryListResponse = z.infer<typeof DirectoryListResponseSchema>;
