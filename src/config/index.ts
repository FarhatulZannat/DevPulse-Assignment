import dotenv from "dotenv";

dotenv.config({ quiet: true });

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
};

const parseSaltRounds = (value: string | undefined): number => {
  const rounds = Number(value ?? 10);

  if (!Number.isInteger(rounds) || rounds < 8 || rounds > 12) {
    throw new Error("BCRYPT_SALT_ROUNDS must be between 8 and 12");
  }

  return rounds;
};

const config = Object.freeze({
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL ?? "",
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  bcryptSaltRounds: parseSaltRounds(process.env.BCRYPT_SALT_ROUNDS),
  nodeEnv: process.env.NODE_ENV ?? "development",
});

export const validateConfig = (): void => {
  const missingVariables: string[] = [];

  if (!config.databaseUrl) missingVariables.push("DATABASE_URL");
  if (!config.jwtSecret) missingVariables.push("JWT_SECRET");

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }
};

export default config;
