import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../src/errors/AppError.js";
import {
  validateLoginInput,
  validateSignupInput,
} from "../src/modules/auth/auth.validation.js";
import {
  validateCreateIssueInput,
  validateIssueFilters,
  validateIssueId,
  validateUpdateIssueInput,
} from "../src/modules/issues/issue.validation.js";

const isBadRequest = (error: unknown): boolean => {
  return error instanceof AppError && error.statusCode === StatusCodes.BAD_REQUEST;
};

describe("authentication validation", () => {
  it("normalizes signup data and defaults to contributor", () => {
    assert.deepEqual(
      validateSignupInput({
        name: "  John Doe  ",
        email: "JOHN.DOE@DEVPULSE.COM ",
        password: "securePassword123",
      }),
      {
        name: "John Doe",
        email: "john.doe@devpulse.com",
        password: "securePassword123",
        role: "contributor",
      },
    );
  });

  it("rejects invalid roles and login credentials", () => {
    assert.throws(
      () =>
        validateSignupInput({
          name: "John Doe",
          email: "john@example.com",
          password: "secret",
          role: "admin",
        }),
      isBadRequest,
    );
    assert.throws(
      () => validateLoginInput({ email: "not-an-email", password: "" }),
      isBadRequest,
    );
  });
});

describe("issue validation", () => {
  it("accepts a valid issue and trims text fields", () => {
    assert.deepEqual(
      validateCreateIssueInput({
        title: "  Connection timeout  ",
        description: "  This description is at least twenty characters long.  ",
        type: "bug",
      }),
      {
        title: "Connection timeout",
        description: "This description is at least twenty characters long.",
        type: "bug",
      },
    );
  });

  it("rejects client-provided reporter and short descriptions", () => {
    assert.throws(
      () =>
        validateCreateIssueInput({
          title: "Connection timeout",
          description: "Too short",
          type: "bug",
          reporter_id: 99,
        }),
      isBadRequest,
    );
  });

  it("defaults list sorting and validates filters", () => {
    assert.deepEqual(validateIssueFilters({}), { sort: "newest" });
    assert.deepEqual(
      validateIssueFilters({
        sort: "oldest",
        type: "feature_request",
        status: "resolved",
      }),
      {
        sort: "oldest",
        type: "feature_request",
        status: "resolved",
      },
    );
    assert.throws(
      () => validateIssueFilters({ status: "closed" }),
      isBadRequest,
    );
  });

  it("accepts only positive integer issue ids", () => {
    assert.equal(validateIssueId("42"), 42);
    assert.throws(() => validateIssueId("0"), isBadRequest);
    assert.throws(() => validateIssueId("abc"), isBadRequest);
  });

  it("validates partial updates and rejects unsupported fields", () => {
    assert.deepEqual(
      validateUpdateIssueInput({
        title: "  Updated issue title  ",
        status: "in_progress",
      }),
      {
        title: "Updated issue title",
        status: "in_progress",
      },
    );
    assert.throws(
      () => validateUpdateIssueInput({ reporter_id: 2 }),
      isBadRequest,
    );
    assert.throws(() => validateUpdateIssueInput({}), isBadRequest);
  });
});
