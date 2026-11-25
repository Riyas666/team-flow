
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  acceptInvitation,
  createInvitation,
} from "../services/invitation.service.js";
import Invitation from "../models/Invitation.js"
import { sendInvitationEmail } from "../services/email.service.js";



export async function createInvitationHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  let invitationId: string | undefined;

  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { name, email, role } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and role are required.",
      });
    }

    const invitation = await createInvitation(
      {
        name,
        email,
        role: role as "teamLeader" | "employee",
      },
      req.auth,
    );

    invitationId = invitation.id;

    // Send the invitation email before responding to the frontend.
    try {
      await sendInvitationEmail({
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
      });
    } catch (emailError) {
      // Remove the unusable invitation so it can be retried.
      await Invitation.deleteOne({
        _id: invitation.id,
        companyId: req.auth.companyId,
        acceptedAt: null,
      });

      invitationId = undefined;
      throw emailError;
    }

    // Never return the raw invitation token to the frontend.
    return res.status(201).json({
      message: "Invitation created and email sent successfully.",
      invitation: {
        id: invitation.id,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errors: Record<string, { status: number; message: string }> = {
        INVALID_AUTH_CONTEXT: {
          status: 401,
          message: "Invalid authentication context.",
        },
        FORBIDDEN: {
  status: 403,
  message: "Only the workspace owner can invite members.",
},
        INVALID_NAME: {
          status: 400,
          message: "Name must be between 2 and 100 characters.",
        },
        INVALID_EMAIL: {
          status: 400,
          message: "Please provide a valid email address.",
        },
        INVALID_ROLE: {
          status: 400,
          message: "Choose a valid member role.",
        },
        EMAIL_ALREADY_EXISTS: {
          status: 409,
          message: "An account with this email already exists.",
        },
        INVITATION_ALREADY_EXISTS: {
          status: 409,
          message: "A valid invitation already exists for this email.",
        },
        INVITATION_EMAIL_FAILED: {
          status: 502,
          message: "The invitation email could not be sent. Please try again.",
        },
      };

      if (error.message === "INVITATION_EMAIL_FAILED") {
        return res.status(502).json({
          message:
            "The invitation email could not be sent. Please try again.",
        });
      }

      const knownError = errors[error.message];

      if (knownError) {
        return res.status(knownError.status).json({
          message: knownError.message,
        });
      }
    }

    console.error("Create invitation failed:", error);

    return res.status(500).json({
      message: "Failed to create invitation.",
    });
  }
}

export async function acceptInvitationHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { token, password } = req.body ?? {};

    if (typeof token !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Invitation token and password are required.",
      });
    }

    const user = await acceptInvitation({ token, password });

    return res.status(201).json({
      message: "Invitation accepted successfully. You can now log in.",
      user,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_INVITATION") {
        return res.status(400).json({
          message: "This invitation is invalid, expired, or already used.",
        });
      }

      if (error.message === "VALIDATION_PASSWORD") {
        return res.status(400).json({
          message: "Password must be between 8 and 72 characters.",
        });
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return res.status(409).json({
          message: "An account with this email already exists.",
        });
      }
    }

    console.error("Accept invitation failed:", error);

    return res.status(500).json({
      message: "Failed to accept invitation.",
    });
  }
}
