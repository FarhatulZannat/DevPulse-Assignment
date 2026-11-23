import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import config from "../../config/index.js";
import { pool } from "../../db/index.js";
import { AppError } from "../../errors/AppError.js";
import type { PublicUser, SignupInput } from "./auth.interface.js";

type DatabaseError = Error & { code?: string };

const signup = async (payload: SignupInput): Promise<PublicUser> => {
  const existingUser = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE email = $1",
    [payload.email],
  );

  if ((existingUser.rowCount ?? 0) > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Email is already registered",
      "A user with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcryptSaltRounds,
  );

  try {
    const result = await pool.query<PublicUser>(
      `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at, updated_at
      `,
      [payload.name, payload.email, hashedPassword, payload.role],
    );

    return result.rows[0]!;
  } catch (error: unknown) {
    if ((error as DatabaseError).code === "23505") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Email is already registered",
        "A user with this email already exists",
      );
    }

    throw error;
  }
};

export const authService = {
  signup,
};
