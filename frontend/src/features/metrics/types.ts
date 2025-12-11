export interface Finding {
  id: string;
  tool: string;
  type: "Error" | "Warning" | "Info";
  message: string;
  filepath: string;
  timestamp: number;
  line: number;
  ruleId?: string;
}

export const METRIC_TYPES = ["Error", "Warning", "Info"] as const;

export type SortOrder = "type_desc" | "type_asc" | "newest" | "oldest";

export interface DateRange {
  start: string | null;
  end: string | null;
}
