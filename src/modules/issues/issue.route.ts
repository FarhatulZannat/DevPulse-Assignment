import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { issueController } from "./issue.controller.js";

export const issueRouter = Router();

issueRouter.get("/", issueController.getAllIssues);
issueRouter.post("/", auth(), issueController.createIssue);
