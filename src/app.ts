import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { authRouter } from "./modules/auth/auth.route.js";

const app: Application = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API is running",
  });
});

app.use("/api/auth", authRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
