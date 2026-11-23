import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/index.js";
import { pool } from "../db/index.js";
import { AppError } from "../errors/AppError.js";
import { USER_ROLES, type AuthUser, type UserRole } from "../types/index.js";
import { catchAsync } from "../utils/catchAsync.js";

interface TokenPayload extends JwtPayload {
  id: number;
  name: string;
  role: UserRole;
}

const extractToken = (authorization: string | undefined): string => {
  if (!authorization?.trim()) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Authentication required",
      "Authorization token is missing",
    );
  }

  const value = authorization.trim();
  const token = value.toLowerCase().startsWith("bearer ")
    ? value.slice(7).trim()
    : value;

  if (!token) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Authentication required",
      "Authorization token is missing",
    );
  }

  return token;
};

const isTokenPayload = (payload: string | JwtPayload): payload is TokenPayload => {
  return (
    typeof payload !== "string" &&
    Number.isInteger(payload.id) &&
    typeof payload.name === "string" &&
    typeof payload.role === "string" &&
    USER_ROLES.includes(payload.role as UserRole)
  );
};

export const auth = (...allowedRoles: UserRole[]): RequestHandler => {
  return catchAsync(async (req, _res, next) => {
    const token = extractToken(req.headers.authorization);
    let decoded: string | JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Invalid or expired token",
        "Provide a valid JWT token",
      );
    }

    if (!isTokenPayload(decoded)) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Invalid token payload",
        "JWT payload is missing required user information",
      );
    }

    const result = await pool.query<AuthUser>(
      "SELECT id, name, role FROM users WHERE id = $1",
      [decoded.id],
    );
    const user = result.rows[0];

    if (!user || !USER_ROLES.includes(user.role)) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "User account no longer exists",
        "The token does not belong to an active account",
      );
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Insufficient permissions",
        "Your role cannot perform this operation",
      );
    }

    req.user = user;
    next();
  });
};
