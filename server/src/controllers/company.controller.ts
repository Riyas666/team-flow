
import type { Request, Response } from "express";
import { Readable } from "node:stream";
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
} from "../services/company.service.js";
import Company from "../models/Company.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import cloudinary from "../config/cloudinary.js";

export async function getWorkspaceSettingsHandler(
  req: Request,
  res: Response,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.auth?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const settings = await getWorkspaceSettings(companyId);

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    return res.status(message === "COMPANY_NOT_FOUND" ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

export async function updateWorkspaceSettingsHandler(
  req: Request,
  res: Response,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.auth?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, description, logo } = req.body;

    if (
      (name !== undefined && typeof name !== "string") ||
      (description !== undefined && typeof description !== "string") ||
      (logo !== undefined && typeof logo !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace settings",
      });
    }

    const settings = await updateWorkspaceSettings(companyId, {
      name,
      description,
      logo,
    });

    return res.status(200).json({
      success: true,
      message: "Workspace settings updated successfully",
      data: settings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    return res.status(message === "COMPANY_NOT_FOUND" ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

export async function uploadCompanyLogoHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a company logo",
      });
    }

    const uploadResult = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "teamflow/company-logos",
            resource_type: "image",
            transformation: [
              { width: 500, height: 500, crop: "limit" },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Logo upload failed"));
              return;
            }

            resolve({ secure_url: result.secure_url });
          },
        );

        Readable.from(req.file!.buffer).pipe(stream);
      },
    );

    const company = await Company.findOneAndUpdate(
      {
        _id: req.auth.companyId,
        isActive: true,
      },
      {
        $set: { logo: uploadResult.secure_url },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("name description logo");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company logo uploaded successfully",
      company,
    });
  } catch (error) {
    console.error("Company logo upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload company logo",
    });
  }
}
