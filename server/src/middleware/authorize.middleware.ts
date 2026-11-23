
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";

type Role = "owner" | "teamLeader" | "employee";

export function authorize(...allowedRoles: Role[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.auth.role as Role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}
