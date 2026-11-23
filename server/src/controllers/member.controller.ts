
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { listMembers,
         deleteMember,
         updateMemberStatus
 } from "../services/member.service.js";

export async function listMembersHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const members = await listMembers(req.auth);

    return res.status(200).json({ members });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_AUTH_CONTEXT") {
      return res.status(401).json({
        message: "Invalid authentication context.",
      });
    }

    console.error("List members error:", error);

    return res.status(500).json({
      message: "Failed to load members.",
    });
  }
}


export async function deleteMemberHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const memberId = req.params.memberId;

if (!memberId || Array.isArray(memberId)) {
  return res.status(400).json({
    message: "Invalid member ID.",
  });
}

const member = await deleteMember(memberId, req.auth);

    return res.status(200).json({
      message: "Member removed successfully.",
      member,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errors: Record<
        string,
        { status: number; message: string }
      > = {
        INVALID_AUTH_CONTEXT: {
          status: 401,
          message: "Invalid authentication context.",
        },
        INVALID_MEMBER_ID: {
          status: 400,
          message: "Invalid member ID.",
        },
        FORBIDDEN: {
          status: 403,
          message: "You are not allowed to remove this member.",
        },
        CANNOT_REMOVE_SELF: {
          status: 400,
          message: "You cannot remove yourself.",
        },
        CANNOT_REMOVE_OWNER: {
          status: 403,
          message: "An owner cannot be removed.",
        },
        MEMBER_NOT_FOUND: {
          status: 404,
          message: "Active member not found in your workspace.",
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return res.status(knownError.status).json({
          message: knownError.message,
        });
      }
    }

    console.error("Delete member error:", error);

    return res.status(500).json({
      message: "Failed to remove member.",
    });
  }
}


export async function updateMemberStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const memberId = req.params.memberId;
    const { isActive } = req.body ?? {};

    if (!memberId || Array.isArray(memberId)) {
      return res.status(400).json({
        message: "Invalid member ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be a boolean.",
      });
    }

    const member = await updateMemberStatus(
      memberId,
      isActive,
      req.auth,
    );

    return res.status(200).json({
      message: isActive
        ? "Member activated successfully."
        : "Member deactivated successfully.",
      member,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errors: Record<string, { status: number; message: string }> = {
        INVALID_MEMBER_ID: {
          status: 400,
          message: "Invalid member ID.",
        },
        INVALID_AUTH_CONTEXT: {
          status: 401,
          message: "Invalid authentication context.",
        },
        FORBIDDEN: {
          status: 403,
          message: "You are not allowed to change this member's status.",
        },
        CANNOT_CHANGE_OWN_STATUS: {
          status: 400,
          message: "You cannot change your own status.",
        },
        CANNOT_CHANGE_OWNER_STATUS: {
          status: 403,
          message: "An owner cannot be deactivated through this action.",
        },
        MEMBER_NOT_FOUND: {
          status: 404,
          message: "Member not found in your workspace.",
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return res.status(knownError.status).json({
          message: knownError.message,
        });
      }
    }

    console.error("Update member status error:", error);

    return res.status(500).json({
      message: "Failed to update member status.",
    });
  }
}
