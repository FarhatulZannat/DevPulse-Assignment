import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/AppError.js";

type ErrorWithMetadata = Error & {
  body?: unknown;
  code?: string;
  errors?: unknown;
  status?: number;
  statusCode?: number;
};

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const err = error as ErrorWithMetadata;
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let errors: unknown = "Unexpected server error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors ?? error.message;
  } else if (err instanceof SyntaxError && err.body !== undefined) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid JSON payload";
    errors = err.message;
  } else if (err.code === "23505") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Resource already exists";
    errors = "A unique field already has this value";
  } else if (typeof err.status === "number" && err.status < 500) {
    statusCode = err.status;
    message = err.message;
    errors = err.message;
  }

  if (statusCode >= 500) {
    console.error(err.stack ?? err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
