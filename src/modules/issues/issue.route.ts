import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { issueController } from "./issue.controller.js";

export const issueRouter = Router();

issueRouter.get("/", issueController.getAllIssues);
issueRouter.post("/", auth(), issueController.createIssue);
issueRouter.get("/:id", issueController.getSingleIssue);
issueRouter.patch("/:id", auth(), issueController.updateIssue);
issueRouter.delete("/:id", auth("maintainer"), issueController.deleteIssue);
