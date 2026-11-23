import { pool } from "../../db/index.js";
import type {
  CreateIssueInput,
  IssueFilters,
  IssueRecord,
  IssueReporter,
  IssueResponse,
} from "./issue.interface.js";

const createIssue = async (
  payload: CreateIssueInput,
  reporterId: number,
): Promise<IssueRecord> => {
  const result = await pool.query<IssueRecord>(
    `
      INSERT INTO issues (title, description, type, reporter_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, type, status, reporter_id,
                created_at, updated_at
    `,
    [payload.title, payload.description, payload.type, reporterId],
  );

  return result.rows[0]!;
};

const getAllIssues = async (filters: IssueFilters): Promise<IssueResponse[]> => {
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters.type) {
    values.push(filters.type);
    conditions.push(`type = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortDirection = filters.sort === "oldest" ? "ASC" : "DESC";
  const issuesResult = await pool.query<IssueRecord>(
    `
      SELECT id, title, description, type, status, reporter_id,
             created_at, updated_at
      FROM issues
      ${whereClause}
      ORDER BY created_at ${sortDirection}, id ${sortDirection}
    `,
    values,
  );

  if (issuesResult.rows.length === 0) {
    return [];
  }

  const reporterIds = [
    ...new Set(issuesResult.rows.map((issue) => issue.reporter_id)),
  ];
  const reportersResult = await pool.query<IssueReporter>(
    `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1::int[])
    `,
    [reporterIds],
  );
  const reportersById = new Map(
    reportersResult.rows.map((reporter) => [reporter.id, reporter]),
  );

  return issuesResult.rows.map(({ reporter_id, ...issue }) => ({
    ...issue,
    reporter: reportersById.get(reporter_id) ?? null,
  }));
};

export const issueService = {
  createIssue,
  getAllIssues,
};
