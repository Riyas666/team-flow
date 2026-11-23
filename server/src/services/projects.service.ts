
import mongoose from "mongoose";
import Project from "../models/Project.js";
import { recordActivity } from "./activity.service.js";
import Task from "../models/Tasks.js";

interface CreateProjectInput {
  name: string;
  description?: string;
}

interface ProjectActor {
  userId: string;
  companyId: string;
  role: "owner" | "teamLeader" | "employee";
}

interface UpdateProjectInput {
  name: string;
  description?: string;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  actor: ProjectActor,
) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  if (!["owner", "teamLeader"].includes(actor.role)) {
    throw new Error("PROJECT_UPDATE_FORBIDDEN");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("INVALID_PROJECT_ID");
  }

  if (
    typeof input.name !== "string" ||
    (input.description !== undefined &&
      typeof input.description !== "string")
  ) {
    throw new Error("INVALID_PROJECT_INPUT");
  }

  const name = input.name.trim();
  const description = input.description?.trim() ?? "";

  if (name.length < 2 || name.length > 120) {
    throw new Error("INVALID_PROJECT_NAME");
  }

  if (description.length > 2000) {
    throw new Error("INVALID_PROJECT_DESCRIPTION");
  }

  const project = await Project.findOneAndUpdate(
    {
      _id: projectId,
      companyId: actor.companyId,
    },
    {
      $set: { name, description },
    },
    {
      new: true,
      runValidators: true,
    },
  ).select("-__v");

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  await recordActivity({
    companyId: actor.companyId,
    actorId: actor.userId,
    action: "project_updated",
    projectId: project._id.toString(),
    details: `Updated project "${project.name}"`,
  });

  return project;
}


export async function createProject(
  input: CreateProjectInput,
  actor: ProjectActor,
) {
  if (
    typeof input.name !== "string"
  ) {
    throw new Error("INVALID_PROJECT_NAME");
  }

  if (
    input.description !== undefined &&
    typeof input.description !== "string"
  ) {
    throw new Error("INVALID_PROJECT_DESCRIPTION");
  }

  const name = input.name.trim();
  const description = input.description?.trim() ?? "";

  if (name.length < 2 || name.length > 120) {
    throw new Error("INVALID_PROJECT_NAME");
  }

  if (description.length > 2000) {
    throw new Error("INVALID_PROJECT_DESCRIPTION");
  }

  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  if (!["owner", "teamLeader"].includes(actor.role)) {
    throw new Error("PROJECT_CREATE_FORBIDDEN");
  }

  const project = await Project.create({
    name,
    description,
    companyId: actor.companyId,
    createdBy: actor.userId,
  });

  await recordActivity({
    companyId: actor.companyId,
    actorId: actor.userId,
    action: "project_created",
    projectId: project._id.toString(),
    details: `Created project "${project.name}"`,
  });

  return project;
}


export async function listProjects(actor: ProjectActor) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  if (!["owner", "teamLeader", "employee"].includes(actor.role)) {
    throw new Error("FORBIDDEN");
  }

  return Project.find({ companyId: actor.companyId })
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();
}


export async function deleteProject(
  projectId: string,
  actor: ProjectActor,
) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  if (!["owner", "teamLeader"].includes(actor.role)) {
    throw new Error("PROJECT_DELETE_FORBIDDEN");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const project = await Project.findOne({
    _id: projectId,
    companyId: actor.companyId,
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const taskCount = await Task.countDocuments({
    projectId: project._id,
    companyId: actor.companyId,
  });

  if (taskCount > 0) {
    throw new Error("PROJECT_HAS_TASKS");
  }

  await Project.deleteOne({
    _id: project._id,
    companyId: actor.companyId,
  });

  return {
    _id: project._id.toString(),
    name: project.name,
  };
}
  