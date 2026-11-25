
import mongoose from "mongoose";
import Task from "../models/Tasks.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { recordActivity } from "./activity.service.js";

type Role = "owner" | "teamLeader" | "employee";

interface TaskActor {
  userId: string;
  companyId: string;
  role: Role;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  assignedTo?: string | null;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}

export async function createTask(
  input: CreateTaskInput,
  actor: TaskActor,
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

  const title = input.title.trim();
  const description = input.description?.trim() ?? "";

  if (title.length < 2 || title.length > 150) {
    throw new Error("INVALID_TASK_TITLE");
  }

  if (description.length > 2000) {
    throw new Error("INVALID_TASK_DESCRIPTION");
  }

  if (!mongoose.isValidObjectId(input.projectId)) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const project = await Project.findOne({
    _id: input.projectId,
    companyId: actor.companyId,
    status: { $ne: "archived" },
  }).select("_id");

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  let assignedTo: mongoose.Types.ObjectId | null = null;

  if (input.assignedTo) {
    if (!mongoose.isValidObjectId(input.assignedTo)) {
      throw new Error("INVALID_ASSIGNEE_ID");
    }

    const assignee = await User.findOne({
      _id: input.assignedTo,
      companyId: actor.companyId,
      isActive: true,
    }).select("_id");

    if (!assignee) {
      throw new Error("ASSIGNEE_NOT_FOUND");
    }

    assignedTo = assignee._id;
  }

  let dueDate: Date | null = null;

  if (input.dueDate) {
    dueDate = new Date(input.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      throw new Error("INVALID_DUE_DATE");
    }
  }

const task = await Task.create({
  title,
  description,
  companyId: actor.companyId,
  projectId: project._id,
  assignedTo,
  createdBy: actor.userId,
  priority: input.priority ?? "medium",
  dueDate,
});

await recordActivity({
  companyId: actor.companyId,
  actorId: actor.userId,
  action: "task_created",
  projectId: project._id.toString(),
  taskId: task._id.toString(),
  details: `Created task "${task.title}"`,
});

if (assignedTo) {
  await recordActivity({
    companyId: actor.companyId,
    actorId: actor.userId,
    action: "task_assigned",
    projectId: project._id.toString(),
    taskId: task._id.toString(),
    details: `Assigned task "${task.title}" to a team member`,
  });
}

return task;
}

export async function listTasks(actor: TaskActor) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  if (!["owner", "teamLeader", "employee"].includes(actor.role)) {
    throw new Error("FORBIDDEN");
  }

  const projects = await Project.find({
    companyId: actor.companyId,
    status: { $ne: "archived" },
  }).distinct("_id");

  return Task.find({
    companyId: actor.companyId,
    projectId: { $in: projects },
  })
    .sort({ createdAt: -1 })
    .populate("projectId", "name")
    .populate("assignedTo", "name email")
    .select("-__v")
    .lean();
}


type TaskStatus = "todo" | "in_progress" | "completed";

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  actor: TaskActor,
) {
  if (
    !mongoose.isValidObjectId(taskId) ||
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_TASK_ID");
  }

  if (!["owner", "teamLeader", "employee"].includes(actor.role)) {
    throw new Error("FORBIDDEN");
  }

  if (!["todo", "in_progress", "completed"].includes(status)) {
    throw new Error("INVALID_TASK_STATUS");
  }

  const existingTask = await Task.findOne({
    _id: taskId,
    companyId: actor.companyId,
  }).select("_id title status projectId");

  if (!existingTask) {
    throw new Error("TASK_NOT_FOUND");
  }

  const project = await Project.findOne({
    _id: existingTask.projectId,
    companyId: actor.companyId,
    status: { $ne: "archived" },
  }).select("_id");

  if (!project) {
    throw new Error("TASK_NOT_FOUND");
  }

  if (existingTask.status === status) {
    return existingTask;
  }

  const task = await Task.findOneAndUpdate(
    {
      _id: taskId,
      companyId: actor.companyId,
    },
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .select("-__v")
    .lean();

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  await recordActivity({
    companyId: actor.companyId,
    actorId: actor.userId,
    action: "task_status_updated",
    projectId: existingTask.projectId.toString(),
    taskId: task._id.toString(),
    details: `Changed task "${existingTask.title}" status from "${existingTask.status}" to "${status}"`,
  });

  return task;
}


export async function deleteTask(
  taskId: string,
  actor: TaskActor,
) {
  if (
    !mongoose.isValidObjectId(taskId) ||
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_TASK_ID");
  }

  if (actor.role !== "owner" && actor.role !== "teamLeader") {
    throw new Error("FORBIDDEN");
  }

  const task = await Task.findOne({
    _id: taskId,
    companyId: actor.companyId,
  })
    .select("_id title projectId")
    .lean();

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  const result = await Task.deleteOne({
    _id: task._id,
    companyId: actor.companyId,
  });

  if (result.deletedCount !== 1) {
    throw new Error("TASK_NOT_FOUND");
  }

  await recordActivity({
    companyId: actor.companyId,
    actorId: actor.userId,
    action: "task_deleted",
    projectId: task.projectId.toString(),
    taskId: task._id.toString(),
    details: `Deleted task "${task.title}"`,
  });

  return {
    _id: task._id.toString(),
    title: task.title,
  };
}


type UpdateTaskInput = {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  assignedTo?: string | null;
  dueDate?: string | null;
};

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  actor: TaskActor
) {
  if (
    !mongoose.isValidObjectId(taskId) ||
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_TASK_ID");
  }

  // Enforce authorization inside the service too.
  if (actor.role !== "owner" && actor.role !== "teamLeader") {
    throw new Error("FORBIDDEN");
  }

  const task = await Task.findOne({
    _id: taskId,
    companyId: actor.companyId,
  });

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  const updates: Record<string, unknown> = {};
  const changedFields: string[] = [];

  if (input.title !== undefined) {
    if (
      typeof input.title !== "string" ||
      input.title.trim().length < 2 ||
      input.title.trim().length > 150
    ) {
      throw new Error("INVALID_TASK_TITLE");
    }

    const value = input.title.trim();

    if (value !== task.title) {
      updates.title = value;
      changedFields.push("title");
    }
  }

  if (input.description !== undefined) {
    if (
      typeof input.description !== "string" ||
      input.description.length > 2000
    ) {
      throw new Error("INVALID_TASK_DESCRIPTION");
    }

    if (input.description !== task.description) {
      updates.description = input.description;
      changedFields.push("description");
    }
  }

  if (input.priority !== undefined) {
    if (!["low", "medium", "high"].includes(input.priority)) {
      throw new Error("INVALID_TASK_PRIORITY");
    }

    if (input.priority !== task.priority) {
      updates.priority = input.priority;
      changedFields.push("priority");
    }
  }

  if (input.assignedTo !== undefined) {
    let assigneeId: string | null = input.assignedTo;

    if (
      assigneeId !== null &&
      (typeof assigneeId !== "string" ||
        !mongoose.isValidObjectId(assigneeId))
    ) {
      throw new Error("INVALID_ASSIGNEE_ID");
    }

    if (assigneeId !== null) {
      const assignee = await User.findOne({
        _id: assigneeId,
        companyId: actor.companyId,
        isActive: true,
      });

      if (!assignee) {
        throw new Error("ASSIGNEE_NOT_FOUND");
      }
    }

    const currentAssignee = task.assignedTo
      ? String(task.assignedTo)
      : null;

    if (assigneeId !== currentAssignee) {
      updates.assignedTo = assigneeId;
      changedFields.push("assignedTo");
    }
  }

  if (input.dueDate !== undefined) {
    let parsedDate: Date | null = null;

    if (input.dueDate !== null) {
      if (
        typeof input.dueDate !== "string" ||
        input.dueDate.trim() === ""
      ) {
        throw new Error("INVALID_DUE_DATE");
      }

      parsedDate = new Date(input.dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("INVALID_DUE_DATE");
      }
    }

    const currentDate = task.dueDate
      ? new Date(task.dueDate).getTime()
      : null;

    const nextDate = parsedDate?.getTime() ?? null;

    if (currentDate !== nextDate) {
      updates.dueDate = parsedDate;
      changedFields.push("dueDate");
    }
  }

  // Do not write to the database or create activity for no-op edits.
  if (changedFields.length === 0) {
    return task;
  }

  const updatedTask = await Task.findOneAndUpdate(
    {
      _id: taskId,
      companyId: actor.companyId,
    },
    { $set: updates },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedTask) {
    throw new Error("TASK_NOT_FOUND");
  }

  await recordActivity({
    companyId: actor.companyId,
    actorId: actor.userId,
    action: "task_updated",
    projectId: String(updatedTask.projectId),
    taskId: String(updatedTask._id),
    details: `Updated task fields: ${changedFields.join(", ")}`,
  });

  return updatedTask;
}
 