import { pool } from "../../db/index.js";
import type { CreateIssueInput, IssueRecord } from "./issue.interface.js";

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

export const issueService = {
  createIssue,
};
