
import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

type MemberRole = "owner" | "teamLeader" | "employee";

interface InvitationActor {
  userId: string;
  companyId: string;
  role: MemberRole;
}

interface CreateInvitationInput {
  name: string;
  email: string;
  role: "teamLeader" | "employee";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(
  input: CreateInvitationInput,
  actor: InvitationActor,
) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  if (actor.role !== "owner" && actor.role !== "teamLeader") {
    throw new Error("FORBIDDEN");
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = input.role;

  if (name.length < 2 || name.length > 100) {
    throw new Error("INVALID_NAME");
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("INVALID_EMAIL");
  }

  if (role !== "teamLeader" && role !== "employee") {
    throw new Error("INVALID_ROLE");
  }

  // Team leaders can invite employees only.
  if (actor.role === "teamLeader" && role !== "employee") {
    throw new Error("FORBIDDEN");
  }

  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // Prevent multiple outstanding invitations for this company/email.
  const existingInvitation = await Invitation.findOne({
    companyId: actor.companyId,
    email,
    acceptedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (existingInvitation) {
    throw new Error("INVITATION_ALREADY_EXISTS");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    name,
    email,
    role,
    companyId: actor.companyId,
    invitedBy: actor.userId,
    tokenHash,
    expiresAt,
  });

  // Return the raw token only once; it is never stored in the database.
  return {
    id: invitation._id.toString(),
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    token,
  };
}

interface AcceptInvitationInput {
  token: string;
  password: string;
}

export async function acceptInvitation(
  input: AcceptInvitationInput,
) {
  const token = input.token.trim();
  const password = input.password;

  if (!token || token.length > 200) {
    throw new Error("INVALID_INVITATION");
  }

  if (password.length < 8 || password.length > 72) {
    throw new Error("VALIDATION_PASSWORD");
  }

  const tokenHash = hashToken(token);
  const passwordHash = await bcrypt.hash(password, 12);
  const session = await mongoose.startSession();

  try {
    let createdUserId: mongoose.Types.ObjectId | undefined;

    await session.withTransaction(async () => {
      const invitation = await Invitation.findOne({
        tokenHash,
        acceptedAt: null,
        expiresAt: { $gt: new Date() },
      })
        .select("+tokenHash")
        .session(session);

      if (!invitation) {
        throw new Error("INVALID_INVITATION");
      }

      // Email is globally unique in the User model.
      const existingUser = await User.findOne({
        email: invitation.email,
      })
        .session(session)
        .lean();

      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      const [user] = await User.create(
        [
          {
            name: invitation.name,
            email: invitation.email,
            passwordHash,
            companyId: invitation.companyId,
            role: invitation.role,
          },
        ],
        { session },
      );

      if (!user) {
        throw new Error("INVITATION_ACCEPTANCE_FAILED");
      }

      invitation.acceptedAt = new Date();
      await invitation.save({ session });

      createdUserId = user._id;
    });

    if (!createdUserId) {
      throw new Error("INVITATION_ACCEPTANCE_FAILED");
    }

    const user = await User.findById(createdUserId)
      .select("name email companyId role createdAt")
      .lean();

    if (!user) {
      throw new Error("INVITATION_ACCEPTANCE_FAILED");
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      companyId: user.companyId.toString(),
      role: user.role,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
