export interface DirectoryListRequest {
  path: string;
}

export interface DirectoryListResponse {
  current_path: string;
  parent_path: string;
  directories: string[];
}
