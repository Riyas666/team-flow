
import type { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { Readable } from 'node:stream'
import cloudinary from '../config/cloudinary.js'

export async function getMyProfile(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const user = await User.findById(req.auth!.userId)
      .select(
        "name profilePicture email companyId role isActive createdAt updatedAt",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile failed:", error);

    return res.status(500).json({
      message: "Unable to load your profile.",
    });
  }
}

export async function updateMyProfile(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const body = req.body ?? {};
    const allowedFields = ["name", "profilePicture"];
    const providedFields = Object.keys(body);

    if (
      providedFields.length === 0 ||
      providedFields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        message: "Only name and profile picture can be updated.",
      });
    }

    const updates: {
      name?: string;
      profilePicture?: string | null;
    } = {};

    if ("name" in body) {
      if (typeof body.name !== "string") {
        return res.status(400).json({
          message: "Name must be a string.",
        });
      }

      const name = body.name.trim();

      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          message: "Name must be between 2 and 100 characters.",
        });
      }

      updates.name = name;
    }

    if ("profilePicture" in body) {
      if (body.profilePicture === null) {
        updates.profilePicture = null;
      } else if (typeof body.profilePicture === "string") {
        const profilePicture = body.profilePicture.trim();

        if (profilePicture.length > 2048) {
          return res.status(400).json({
            message: "Profile picture value is too long.",
          });
        }

        updates.profilePicture = profilePicture || null;
      } else {
        return res.status(400).json({
          message: "Profile picture must be a string or null.",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.auth!.userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    )
      .select(
        "name profilePicture email companyId role isActive createdAt updatedAt",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: "Invalid profile information.",
      });
    }

    console.error("Update profile failed:", error);

    return res.status(500).json({
      message: "Unable to update your profile.",
    });
  }
}

export async function uploadProfilePictureHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Authentication required.',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Please select an image.',
      })
    }

    const uploadResult = await new Promise<{
      secure_url: string
      public_id: string
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'teamflow/profile-pictures',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Image upload failed.'))
            return
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          })
        },
      )

      Readable.from(req.file!.buffer).pipe(stream)
    })

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { profilePicture: uploadResult.secure_url },
      {
        new: true,
        runValidators: true,
      },
    ).select('name email profilePicture role isActive createdAt')

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      })
    }

    return res.status(200).json({
      message: 'Profile picture uploaded successfully.',
      user,
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)

    return res.status(500).json({
      message: 'Failed to upload profile picture.',
    })
  }
}