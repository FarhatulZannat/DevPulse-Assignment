import { pool } from "../../db/index.js";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/AppError.js";
import type { AuthUser } from "../../types/index.js";
import type {
  CreateIssueInput,
  IssueFilters,
  IssueRecord,
  IssueReporter,
  IssueResponse,
  UpdateIssueInput,
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

const getSingleIssue = async (id: number): Promise<IssueResponse> => {
  const issueResult = await pool.query<IssueRecord>(
    `
      SELECT id, title, description, type, status, reporter_id,
             created_at, updated_at
      FROM issues
      WHERE id = $1
    `,
    [id],
  );
  const issue = issueResult.rows[0];

  if (!issue) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Issue not found",
      `No issue exists with id ${id}`,
    );
  }

  const reporterResult = await pool.query<IssueReporter>(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id],
  );
  const { reporter_id: _reporterId, ...issueData } = issue;

  return {
    ...issueData,
    reporter: reporterResult.rows[0] ?? null,
  };
};

const updateIssue = async (
  id: number,
  payload: UpdateIssueInput,
  requester: AuthUser,
): Promise<IssueRecord> => {
  const existingResult = await pool.query<IssueRecord>(
    `
      SELECT id, title, description, type, status, reporter_id,
             created_at, updated_at
      FROM issues
      WHERE id = $1
    `,
    [id],
  );
  const existingIssue = existingResult.rows[0];

  if (!existingIssue) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Issue not found",
      `No issue exists with id ${id}`,
    );
  }

  if (requester.role === "contributor") {
    if (existingIssue.reporter_id !== requester.id) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You can only update your own issues",
        "This issue belongs to another contributor",
      );
    }

    if (existingIssue.status !== "open") {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Only open issues can be updated by contributors",
        `This issue is currently ${existingIssue.status}`,
      );
    }

    if (payload.status !== undefined) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Only maintainers can change issue status",
        "Contributors cannot update workflow status",
      );
    }
  }

  const setClauses: string[] = [];
  const values: Array<string | number> = [];

  if (payload.title !== undefined) {
    values.push(payload.title);
    setClauses.push(`title = $${values.length}`);
  }
  if (payload.description !== undefined) {
    values.push(payload.description);
    setClauses.push(`description = $${values.length}`);
  }
  if (payload.type !== undefined) {
    values.push(payload.type);
    setClauses.push(`type = $${values.length}`);
  }
  if (payload.status !== undefined) {
    values.push(payload.status);
    setClauses.push(`status = $${values.length}`);
  }

  values.push(id);
  let whereClause = `id = $${values.length}`;

  if (requester.role === "contributor") {
    values.push(requester.id);
    whereClause += ` AND reporter_id = $${values.length} AND status = 'open'`;
  }

  const updatedResult = await pool.query<IssueRecord>(
    `
      UPDATE issues
      SET ${setClauses.join(", ")}
      WHERE ${whereClause}
      RETURNING id, title, description, type, status, reporter_id,
                created_at, updated_at
    `,
    values,
  );
  const updatedIssue = updatedResult.rows[0];

  if (!updatedIssue) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Issue could not be updated",
      "The issue changed while the update was being processed",
    );
  }

  return updatedIssue;
};

export const issueService = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
