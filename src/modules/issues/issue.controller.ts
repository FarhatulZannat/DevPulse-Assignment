import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { issueService } from "./issue.service.js";
import { validateCreateIssueInput } from "./issue.validation.js";

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

export const issueController = {
  createIssue,
};
