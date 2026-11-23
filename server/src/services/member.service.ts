
import mongoose from "mongoose";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";

type Role = "owner" | "teamLeader" | "employee";
type MemberStatus = "active" | "invited" | "expired";

interface MemberActor {
  userId: string;
  companyId: string;
  role: Role;
}

export async function listMembers(actor: MemberActor) {
  if (!mongoose.isValidObjectId(actor.companyId)) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  const companyId = new mongoose.Types.ObjectId(actor.companyId);

  const [users, invitations] = await Promise.all([
    User.find({
      companyId,  
    })
      .select("name email role isActive createdAt profilePicture")
      .sort({ createdAt: -1 })
      .lean(),

    Invitation.find({
      companyId,
      acceptedAt: null,
    })
      .select("name email role expiresAt createdAt profilePicture")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

const members = users.map((user) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  status: user.isActive ? "active" : "inactive",
  profilePicture: user.profilePicture ?? null,
  createdAt: user.createdAt,
  invitedAt: null,
  expiresAt: null,
}));

  const pendingInvitations = invitations.map((invitation) => ({
    _id: invitation._id.toString(),
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    isActive: false,
    status: (
      invitation.expiresAt.getTime() > Date.now()
        ? "invited"
        : "expired"
    ) as MemberStatus,
    profilePicture: null as string | null,
    createdAt: invitation.createdAt,
    invitedAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
  }));

  return [...members, ...pendingInvitations].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}


export async function deleteMember(
  memberId: string,
  actor: MemberActor,
) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId) ||
    !mongoose.isValidObjectId(memberId)
  ) {
    throw new Error("INVALID_MEMBER_ID");
  }

  if (actor.role !== "owner" && actor.role !== "teamLeader") {
    throw new Error("FORBIDDEN");
  }

  if (memberId === actor.userId) {
    throw new Error("CANNOT_REMOVE_SELF");
  }

  // First, check whether this is an existing user.
  const member = await User.findOne({
    _id: memberId,
    companyId: actor.companyId,
  });

  if (member) {
    if (!member.isActive) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    if (member.role === "owner") {
      throw new Error("CANNOT_REMOVE_OWNER");
    }

    if (
      actor.role === "teamLeader" &&
      member.role !== "employee"
    ) {
      throw new Error("FORBIDDEN");
    }

    member.isActive = false;
    await member.save();

    return {
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
      status: "inactive" as const,
      recordType: "user" as const,
    };
  }

  // If no user exists, check whether this is an invitation.
  const invitation = await Invitation.findOne({
    _id: memberId,
    companyId: actor.companyId,
    acceptedAt: null,
  });

  if (!invitation) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  // Team leaders may revoke employee invitations only.
  if (
    actor.role === "teamLeader" &&
    invitation.role !== "employee"
  ) {
    throw new Error("FORBIDDEN");
  }

  // Revoke the pending/expired invitation.
  await Invitation.deleteOne({
    _id: invitation._id,
    companyId: actor.companyId,
    acceptedAt: null,
  });

  return {
    id: invitation._id.toString(),
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    status:
      invitation.expiresAt.getTime() > Date.now()
        ? ("revoked" as const)
        : ("expired" as const),
    recordType: "invitation" as const,
  };
}


export async function updateMemberStatus(
  memberId: string,
  isActive: boolean,
  actor: MemberActor,
) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId) ||
    !mongoose.isValidObjectId(memberId)
  ) {
    throw new Error("INVALID_MEMBER_ID");
  }

  if (actor.role !== "owner" && actor.role !== "teamLeader") {
    throw new Error("FORBIDDEN");
  }

  if (memberId === actor.userId) {
    throw new Error("CANNOT_CHANGE_OWN_STATUS");
  }

  const member = await User.findOne({
    _id: memberId,
    companyId: actor.companyId,
  });

  if (!member) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  if (member.role === "owner") {
    throw new Error("CANNOT_CHANGE_OWNER_STATUS");
  }

  if (actor.role === "teamLeader" && member.role !== "employee") {
    throw new Error("FORBIDDEN");
  }

  member.isActive = isActive;
  await member.save();

  return {
    id: member._id.toString(),
    name: member.name,
    email: member.email,
    role: member.role,
    isActive: member.isActive,
    status: member.isActive ? "active" : "inactive",
  };
}
