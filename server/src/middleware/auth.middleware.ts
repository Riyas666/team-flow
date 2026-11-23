
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    companyId: string;
    role: "owner" | "teamLeader" | "employee";
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    console.error("JWT_SECRET is missing or invalid.");

    return res.status(500).json({
      message: "Authentication is temporarily unavailable.",
    });
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(decoded.sub)
      .select("_id companyId role isActive")
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Account is unavailable.",
      });
    }

    if (
  !user.companyId ||
  !mongoose.isValidObjectId(user.companyId) ||
  !["owner", "teamLeader", "employee"].includes(user.role)
) {
  return res.status(403).json({
    message: "Account permissions are invalid.",
  });
}

    req.auth = {
      userId: user._id.toString(),
      companyId: user.companyId.toString(),
      role: user.role as "owner" | "teamLeader" | "employee",
    };

    return next();
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    if (
      error instanceof Error &&
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Authentication token expired.",
      });
    }

    console.error("Authentication middleware failed:", error);

    return res.status(500).json({
      message: "Authentication is temporarily unavailable.",
    });
  }
}