import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { authService } from "./auth.service.js";
import { validateSignupInput } from "./auth.validation.js";

const signup = catchAsync(async (req: Request, res: Response) => {
  const payload = validateSignupInput(req.body);
  const user = await authService.signup(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "User registered successfully",
    data: user,
  });
});

export const authController = {
  signup,
};
