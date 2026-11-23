import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/AppError.js";
import { USER_ROLES, type UserRole } from "../../types/index.js";
import type { SignupInput } from "./auth.interface.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const validateSignupInput = (payload: unknown): SignupInput => {
  if (!isObject(payload)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid registration data",
      "Request body must be a JSON object",
    );
  }

  const errors: string[] = [];
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const role = payload.role ?? "contributor";

  if (!name) {
    errors.push("name is required");
  } else if (name.length > 255) {
    errors.push("name must not exceed 255 characters");
  }

  if (!email) {
    errors.push("email is required");
  } else if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    errors.push("email must be a valid email address");
  }

  if (!password) {
    errors.push("password is required");
  } else if (Buffer.byteLength(password, "utf8") > 72) {
    errors.push("password must not exceed 72 bytes");
  }

  if (typeof role !== "string" || !USER_ROLES.includes(role as UserRole)) {
    errors.push("role must be either contributor or maintainer");
  }

  if (errors.length > 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid registration data", errors);
  }

  return {
    name,
    email,
    password,
    role: role as UserRole,
  };
};
