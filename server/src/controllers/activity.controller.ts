
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { listRecentActivities } from "../services/activity.service.js";

export async function listActivitiesHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const rawLimit = req.query.limit;
    const rawCursor = req.query.cursor;

    let limit = 10;

    if (rawLimit !== undefined) {
      if (
        typeof rawLimit !== "string" ||
        !/^\d+$/.test(rawLimit) ||
        Number(rawLimit) < 1
      ) {
        return res.status(400).json({
          message: "Invalid activity limit.",
        });
      }

      limit = Math.min(Number(rawLimit), 50);
    }

    if (
      rawCursor !== undefined &&
      (typeof rawCursor !== "string" || !rawCursor.trim())
    ) {
      return res.status(400).json({
        message: "Invalid activity cursor.",
      });
    }

    const result = await listRecentActivities(
      req.auth,
      limit,
      typeof rawCursor === "string" ? rawCursor : undefined,
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_AUTH_CONTEXT") {
        return res.status(401).json({
          message: "Invalid authentication context.",
        });
      }

      if (error.message === "INVALID_ACTIVITY_CURSOR") {
        return res.status(400).json({
          message: "Invalid activity cursor.",
        });
      }
    }

    console.error("List activities error:", error);

    return res.status(500).json({
      message: "Failed to load activities.",
    });
  }
}
