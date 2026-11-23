
import mongoose from "mongoose";
import Activity from "../models/Activity.js";

type ActivityAction =
  | "project_created"
  | "project_updated"
  | "task_created"
  | "task_assigned"
  | "task_status_updated"
  | "task_deleted"
  | "task_updated"
  

interface CreateActivityInput {
  companyId: string;
  actorId: string;
  action: ActivityAction;
  projectId?: string | null;
  taskId?: string | null;
  details?: string;
}

interface ActivityActor {
  userId: string;
  companyId: string;
}

export async function recordActivity(input: CreateActivityInput) {
  if (
    !mongoose.isValidObjectId(input.companyId) ||
    !mongoose.isValidObjectId(input.actorId)
  ) {
    throw new Error("INVALID_ACTIVITY_CONTEXT");
  }

  if (
    input.projectId &&
    !mongoose.isValidObjectId(input.projectId)
  ) {
    throw new Error("INVALID_ACTIVITY_PROJECT_ID");
  }

  if (
    input.taskId &&
    !mongoose.isValidObjectId(input.taskId)
  ) {
    throw new Error("INVALID_ACTIVITY_TASK_ID");
  }

  return Activity.create({
    companyId: input.companyId,
    actorId: input.actorId,
    action: input.action,
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    details: input.details?.trim() ?? "",
  });
}

export async function listRecentActivities(actor: ActivityActor) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  return Activity.find({
    companyId: actor.companyId,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("actorId", "name")
    .populate("projectId", "name")
    .populate("taskId", "title")
    .select("-__v")
    .lean();
}
