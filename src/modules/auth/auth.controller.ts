import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { authService } from "./auth.service.js";
import { validateLoginInput, validateSignupInput } from "./auth.validation.js";

const signup = catchAsync(async (req: Request, res: Response) => {
  const payload = validateSignupInput(req.body);
  const user = await authService.signup(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "User registered successfully",
    data: user,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const payload = validateLoginInput(req.body);
  const result = await authService.login(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Login successful",
    data: result,
  });
});

export const authController = {
  signup,
  login,
};
