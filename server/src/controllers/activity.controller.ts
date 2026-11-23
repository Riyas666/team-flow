
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

    const activities = await listRecentActivities(req.auth);

    return res.status(200).json({ activities });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_AUTH_CONTEXT") {
      return res.status(401).json({
        message: "Invalid authentication context.",
      });
    }

    console.error("List activities error:", error);

    return res.status(500).json({
      message: "Failed to load activities.",
    });
  }
}
