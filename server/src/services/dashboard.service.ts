
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Tasks.js";
import User from "../models/User.js";

interface DashboardActor {
  userId: string;
  companyId: string;
  role: "owner" | "teamLeader" | "employee";
}

export async function getDashboardSummary(actor: DashboardActor) {
  if (
    !mongoose.isValidObjectId(actor.userId) ||
    !mongoose.isValidObjectId(actor.companyId)
  ) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  const projectFilter = {
    companyId: actor.companyId,
  };

  const taskFilter: Record<string, unknown> = {
    companyId: actor.companyId,
  };

  // Employees only see tasks assigned to them.
  if (actor.role === "employee") {
    taskFilter.assignedTo = actor.userId;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProjects,
    totalTasks,
    completedTasks,
    teamMembers,
    todoTasks,
    inProgressTasks,
    overdueTasks,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),

    Task.countDocuments(taskFilter),

    Task.countDocuments({
      ...taskFilter,
      status: "completed",
    }),

    User.countDocuments({
      companyId: actor.companyId,
      isActive: true,
    }),

    Task.countDocuments({
      ...taskFilter,
      status: "todo",
    }),

    Task.countDocuments({
      ...taskFilter,
      status: "in_progress",
    }),

    Task.countDocuments({
      ...taskFilter,
      status: { $ne: "completed" },
      dueDate: { $lt: today },
    }),
  ]);

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    teamMembers,
    completionPercentage,
    overdueTasks,
    taskStatus: {
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
    },
  };
}
