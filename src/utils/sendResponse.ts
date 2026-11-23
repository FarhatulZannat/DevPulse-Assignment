import type { Response } from "express";

interface SuccessResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  response: SuccessResponse<T>,
): void => {
  const body: { success: true; message: string; data?: T } = {
    success: true,
    message: response.message,
  };

  if (response.data !== undefined) {
    body.data = response.data;
  }

  res.status(response.statusCode).json(body);
};
