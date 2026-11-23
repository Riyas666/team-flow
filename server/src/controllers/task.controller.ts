
import type { Response,
              Request,
              NextFunction
 } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createTask, 
         listTasks,
         updateTaskStatus,
         deleteTask,
         updateTask
       } from "../services/task.service.js";

export async function createTaskHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { title, description, projectId, assignedTo, priority, dueDate } =
      req.body ?? {};

    if (
      typeof title !== "string" ||
      typeof projectId !== "string"
    ) {
      return res.status(400).json({
        message: "Task title and project are required.",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    if (
      assignedTo !== undefined &&
      assignedTo !== null &&
      typeof assignedTo !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid assignee.",
      });
    }

    if (
      priority !== undefined &&
      !["low", "medium", "high"].includes(priority)
    ) {
      return res.status(400).json({
        message: "Invalid task priority.",
      });
    }

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      typeof dueDate !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid due date.",
      });
    }

    const task = await createTask(
      {
        title,
        projectId,
        ...(description !== undefined ? { description } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      },
      req.auth,
    );

    return res.status(201).json({
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        message: "Failed to create task.",
      });
    }

    switch (error.message) {
      case "FORBIDDEN":
        return res.status(403).json({
          message: "You do not have permission to create tasks.",
        });

      case "INVALID_AUTH_CONTEXT":
        return res.status(401).json({
          message: "Invalid authentication context.",
        });

      
      case "INVALID_TASK_TITLE":
        return res.status(400).json({
          message: "Task title must be between 2 and 150 characters.",
        });

      case "INVALID_TASK_DESCRIPTION":
        return res.status(400).json({
          message: "Description cannot exceed 2000 characters.",
        });

      case "INVALID_PROJECT_ID":
        return res.status(400).json({
          message: "Invalid project ID.",
        });

      case "INVALID_ASSIGNEE_ID":
        return res.status(400).json({
          message: "Invalid assignee ID.",
        });

      case "INVALID_DUE_DATE":
        return res.status(400).json({
          message: "Invalid due date.",
        });


      case "PROJECT_NOT_FOUND":
        return res.status(404).json({
          message: "Project not found in your company.",
        });

      case "ASSIGNEE_NOT_FOUND":
        return res.status(404).json({
          message: "Active team member not found in your company.",
        });

      default:
        console.error("Create task error:", error);
        return res.status(500).json({
          message: "Failed to create task.",
        });
    }
  }
}

export async function listTasksHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const tasks = await listTasks(req.auth);

    return res.status(200).json({ tasks });
  
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_AUTH_CONTEXT") {
        return res.status(401).json({
          message: "Invalid authentication context.",
        });
      }

      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          message: "You do not have permission to view tasks.",
        });
      }
    }

    console.error("List tasks error:", error);

    return res.status(500).json({
      message: "Failed to load tasks.",
    });
  }

}


export async function updateTaskStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { taskId } = req.params;
    const { status } = req.body ?? {};

    if (typeof taskId !== "string") {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    if (
      typeof status !== "string" ||
      !["todo", "in_progress", "completed"].includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid task status.",
      });
    }

    const task = await updateTaskStatus(
      taskId,
      status as "todo" | "in_progress" | "completed",
      req.auth,
    );

    return res.status(200).json({
      message: "Task status updated successfully.",
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        message: "Failed to update task status.",
      });
    }

    switch (error.message) {
      case "INVALID_TASK_ID":
        return res.status(400).json({
          message: "Invalid task ID.",
        });

      case "INVALID_TASK_STATUS":
        return res.status(400).json({
          message: "Invalid task status.",
        });

      case "FORBIDDEN":
        return res.status(403).json({
          message: "You do not have permission to update this task.",
  });  

      case "TASK_NOT_FOUND":
        return res.status(404).json({
          message: "Task not found in your company.",
        });

      case "INVALID_AUTH_CONTEXT":
        return res.status(401).json({
          message: "Invalid authentication context.",
        });

      default:
        console.error("Update task status error:", error);
        return res.status(500).json({
          message: "Failed to update task status.",
        });
    }
  }
}


export async function deleteTaskHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { taskId } = req.params;

    if (typeof taskId !== "string") {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const task = await deleteTask(taskId, req.auth);

    return res.status(200).json({
      message: "Task deleted successfully.",
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        message: "Failed to delete task.",
      });
    }

    switch (error.message) {
      case "INVALID_TASK_ID":
        return res.status(400).json({
          message: "Invalid task ID.",
        });

      case "INVALID_AUTH_CONTEXT":
        return res.status(401).json({
          message: "Invalid authentication context.",
        });

      case "FORBIDDEN":
        return res.status(403).json({
          message: "You do not have permission to delete tasks.",
        });

      case "TASK_NOT_FOUND":
        return res.status(404).json({
          message: "Task not found in your company.",
        });

      default:
        console.error("Delete task error:", error);
        return res.status(500).json({
          message: "Failed to delete task.",
        });
    }
  }
}

export async function updateTaskHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const taskId = req.params.taskId;

    if (typeof taskId !== "string") {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const body: unknown = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        message: "Invalid task update fields.",
      });
    }

    const input = body as Record<string, unknown>;
    const allowedFields = [
      "title",
      "description",
      "priority",
      "assignedTo",
      "dueDate",
    ];

    const keys = Object.keys(input);

    if (
      keys.length === 0 ||
      keys.some((key) => !allowedFields.includes(key))
    ) {
      return res.status(400).json({
        message: "Invalid task update fields.",
      });
    }

    if (
      input.title !== undefined &&
      typeof input.title !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid task title.",
      });
    }

    if (
      input.description !== undefined &&
      typeof input.description !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid task description.",
      });
    }

    if (
      input.priority !== undefined &&
      !["low", "medium", "high"].includes(
        input.priority as string
      )
    ) {
      return res.status(400).json({
        message: "Invalid task priority.",
      });
    }

    if (
      input.assignedTo !== undefined &&
      input.assignedTo !== null &&
      typeof input.assignedTo !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid assignee.",
      });
    }

    if (
      input.dueDate !== undefined &&
      input.dueDate !== null &&
      typeof input.dueDate !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid due date.",
      });
    }

    const updatedTask = await updateTask(
      taskId,
      {
        ...(input.title !== undefined
          ? { title: input.title as string }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description as string }
          : {}),
        ...(input.priority !== undefined
          ? {
              priority: input.priority as
                | "low"
                | "medium"
                | "high",
            }
          : {}),
        ...(input.assignedTo !== undefined
          ? {
              assignedTo: input.assignedTo as string | null,
            }
          : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate as string | null }
          : {}),
      },
      req.auth
    );

    return res.status(200).json({
      message: "Task updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error("Update task error:", error);
      return res.status(500).json({
        message: "Failed to update task.",
      });
    }

    const statusByCode: Record<string, number> = {
      INVALID_TASK_ID: 400,
      INVALID_AUTH_CONTEXT: 401,
      FORBIDDEN: 403,
      TASK_NOT_FOUND: 404,
      ASSIGNEE_NOT_FOUND: 404,
      INVALID_TASK_TITLE: 400,
      INVALID_TASK_DESCRIPTION: 400,
      INVALID_TASK_PRIORITY: 400,
      INVALID_ASSIGNEE_ID: 400,
      INVALID_DUE_DATE: 400,
    };

    const status = statusByCode[error.message];

    if (status) {
      return res.status(status).json({
        message: error.message,
      });
    }

    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Failed to update task.",
    });
  }
}
