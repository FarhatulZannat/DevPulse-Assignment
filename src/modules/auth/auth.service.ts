import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../../config/index.js";
import { pool } from "../../db/index.js";
import { AppError } from "../../errors/AppError.js";
import type {
  LoginInput,
  LoginResult,
  PublicUser,
  SignupInput,
} from "./auth.interface.js";
import type { UserRole } from "../../types/index.js";

type DatabaseError = Error & { code?: string };

interface UserWithPassword extends PublicUser {
  password: string;
}

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

const login = async (payload: LoginInput): Promise<LoginResult> => {
  const result = await pool.query<UserWithPassword>(
    `
      SELECT id, name, email, password, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `,
    [payload.email],
  );
  const user = result.rows[0];

  if (!user) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
      "Invalid credentials",
    );
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.password);

  if (!passwordMatches) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
      "Invalid credentials",
    );
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role satisfies UserRole,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>,
    },
  );

  const { password: _password, ...publicUser } = user;

  return { token, user: publicUser };
};

export const authService = {
  signup,
  login,
};
