import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/AppError.js";
import {
  ISSUE_TYPES,
  type CreateIssueInput,
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
