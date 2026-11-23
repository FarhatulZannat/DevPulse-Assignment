import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const catchAsync = (controller: AsyncController): RequestHandler => {
  return (req, res, next): void => {
    void Promise.resolve(controller(req, res, next)).catch(next);
  };
};
