import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/AppError.js";
import {
  ISSUE_STATUSES,
  ISSUE_TYPES,
  type CreateIssueInput,
  type IssueFilters,
  type IssueSort,
  type IssueStatus,
  type IssueType,
} from "./issue.interface.js";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const validateCreateIssueInput = (payload: unknown): CreateIssueInput => {
  if (!isObject(payload)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid issue data",
      "Request body must be a JSON object",
    );
  }

  const errors: string[] = [];
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const type = payload.type;

  if (!title) {
    errors.push("title is required");
  } else if (title.length > 150) {
    errors.push("title must not exceed 150 characters");
  }

  if (!description) {
    errors.push("description is required");
  } else if (description.length < 20) {
    errors.push("description must contain at least 20 characters");
  }

  if (typeof type !== "string" || !ISSUE_TYPES.includes(type as IssueType)) {
    errors.push("type must be either bug or feature_request");
  }

  if ("reporter_id" in payload) {
    errors.push("reporter_id is taken from the authenticated user");
  }

  if ("status" in payload) {
    errors.push("new issues always start with open status");
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid issue data", errors);
  }

  return {
    title,
    description,
    type: type as IssueType,
  };
};

export const validateIssueFilters = (
  query: Record<string, unknown>,
): IssueFilters => {
  const errors: string[] = [];
  const sort = query.sort ?? "newest";
  const type = query.type;
  const status = query.status;

  if (typeof sort !== "string" || !["newest", "oldest"].includes(sort)) {
    errors.push("sort must be either newest or oldest");
  }

  if (
    type !== undefined &&
    (typeof type !== "string" || !ISSUE_TYPES.includes(type as IssueType))
  ) {
    errors.push("type must be either bug or feature_request");
  }

  if (
    status !== undefined &&
    (typeof status !== "string" ||
      !ISSUE_STATUSES.includes(status as IssueStatus))
  ) {
    errors.push("status must be open, in_progress, or resolved");
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid query parameters", errors);
  }

  const filters: IssueFilters = { sort: sort as IssueSort };

  if (type !== undefined) filters.type = type as IssueType;
  if (status !== undefined) filters.status = status as IssueStatus;

  return filters;
};

export const validateIssueId = (value: unknown): number => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid issue id",
      "Issue id must be a positive integer",
    );
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid issue id",
      "Issue id must be a positive integer",
    );
  }

  return id;
};
