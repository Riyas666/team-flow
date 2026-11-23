
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getDashboardSummary } from "../services/dashboard.service.js";

export async function dashboardSummaryHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const summary = await getDashboardSummary(req.auth);

    return res.status(200).json(summary);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "INVALID_AUTH_CONTEXT"
    ) {
      return res.status(401).json({
        message: "Invalid authentication context.",
      });
    }

    console.error("Dashboard summary error:", error);

    return res.status(500).json({
      message: "Failed to load dashboard summary.",
    });
  }
}
