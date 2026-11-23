import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { issueService } from "./issue.service.js";
import {
  validateCreateIssueInput,
  validateIssueFilters,
  validateIssueId,
} from "./issue.validation.js";

const createIssue = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Authentication required",
      "Authenticated user information is missing",
    );
  }

  const payload = validateCreateIssueInput(req.body);
  const issue = await issueService.createIssue(payload, req.user.id);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Issue created successfully",
    data: issue,
  });
});

const getAllIssues = catchAsync(async (req: Request, res: Response) => {
  const filters = validateIssueFilters(req.query);
  const issues = await issueService.getAllIssues(filters);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Issues retrived successfully",
    data: issues,
  });
});

const getSingleIssue = catchAsync(async (req: Request, res: Response) => {
  const id = validateIssueId(req.params.id);
  const issue = await issueService.getSingleIssue(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Issue retrived successfully",
    data: issue,
  });
});

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
};
