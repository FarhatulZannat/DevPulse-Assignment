export const ISSUE_TYPES = ["bug", "feature_request"] as const;
export const ISSUE_STATUSES = ["open", "in_progress", "resolved"] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssueSort = "newest" | "oldest";

export interface CreateIssueInput {
  title: string;
  description: string;
  type: IssueType;
}

export interface IssueRecord {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IssueFilters {
  sort: IssueSort;
  type?: IssueType;
  status?: IssueStatus;
}

export interface IssueReporter {
  id: number;
  name: string;
  role: "contributor" | "maintainer";
}

export interface IssueResponse extends Omit<IssueRecord, "reporter_id"> {
  reporter: IssueReporter | null;
}
