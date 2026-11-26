
import mongoose from "mongoose";
import Activity from "../models/Activity.js";

type ActivityAction =
  | "project_created"
  | "project_updated"
  | "task_created"
  | "task_assigned"
  | "task_status_updated"
  | "task_deleted"
  | "task_updated";

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

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

export async function listRecentActivities(
  actor: ActivityActor,
  requestedLimit = DEFAULT_LIMIT,
  cursor?: string,
) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  const limit = Math.min(
    Math.max(Math.floor(requestedLimit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const filter: Record<string, unknown> = {
  companyId: actor.companyId,
};

  if (cursor) {
    try {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64url").toString("utf8"),
      );

      if (
        !decoded.createdAt ||
        Number.isNaN(new Date(decoded.createdAt).getTime()) ||
        !mongoose.isValidObjectId(decoded.id)
      ) {
        throw new Error();
      }

      const cursorDate = new Date(decoded.createdAt);

      filter.$or = [
        { createdAt: { $lt: cursorDate } },
        {
          createdAt: cursorDate,
          _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
        },
      ];
    } catch {
      throw new Error("INVALID_ACTIVITY_CURSOR");
    }
  }

  const results = await Activity.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate("actorId", "name")
    .populate("projectId", "name")
    .populate("taskId", "title")
    .select("-__v")
    .lean();

  const hasMore = results.length > limit;
  const activities = results.slice(0, limit);
  const lastActivity = activities[activities.length - 1];

  const nextCursor =
    hasMore && lastActivity
      ? Buffer.from(
          JSON.stringify({
            createdAt: lastActivity.createdAt,
            id: lastActivity._id.toString(),
          }),
        ).toString("base64url")
      : null;

  return {
    activities,
    hasMore,
    nextCursor,
  };
}
