
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject
} from "../services/projects.service.js";

export async function createProjectHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { name, description } = req.body ?? {};

    if (
      typeof name !== "string" ||
      (description !== undefined && typeof description !== "string")
    ) {
      return res.status(400).json({
        message: "A project name and a valid description are required.",
      });
    }

    const project = await createProject(
      { name, description },
      req.auth,
    );

    return res.status(201).json({
      message: "Project created successfully.",
      project,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "PROJECT_CREATE_FORBIDDEN") {
        return res.status(403).json({
          message: "You do not have permission to create projects.",
        });
      }

      if (error.message === "INVALID_AUTH_CONTEXT") {
        return res.status(401).json({
          message: "Invalid authentication context.",
        });
      }

      if (
        error.message === "INVALID_PROJECT_NAME" ||
        error.message === "INVALID_PROJECT_DESCRIPTION"
      ) {
        return res.status(400).json({
          message:
            error.message === "INVALID_PROJECT_NAME"
              ? "Project name must be between 2 and 120 characters."
              : "Description cannot exceed 2000 characters.",
        });
      }
    }

    console.error("Project creation failed:", error);

    return res.status(500).json({
      message: "Failed to create project.",
    });
  }
}

export async function listProjectsHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const projects = await listProjects(req.auth);

    return res.status(200).json({
      projects,
    });
  
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_AUTH_CONTEXT") {
        return res.status(401).json({
          message: "Invalid authentication context.",
        });
      }

      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          message: "You do not have permission to view projects.",
        });
      }
    }

    console.error("Project listing failed:", error);

    return res.status(500).json({
      message: "Failed to retrieve projects.",
    });
  }
}


export async function updateProjectHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { name, description } = req.body ?? {};

    const project = await updateProject(
      req.params.projectId as string,
      { name, description },
      req.auth,
    );

    return res.status(200).json({
      message: "Project updated successfully.",
      project,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_AUTH_CONTEXT") {
        return res.status(401).json({
          message: "Invalid authentication context.",
        });
      }

      if (error.message === "PROJECT_UPDATE_FORBIDDEN") {
        return res.status(403).json({
          message: "You do not have permission to update projects.",
        });
      }

      if (error.message === "INVALID_PROJECT_ID") {
        return res.status(400).json({
          message: "Invalid project ID.",
        });
      }

      if (error.message === "PROJECT_NOT_FOUND") {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      if (
        error.message === "INVALID_PROJECT_INPUT" ||
        error.message === "INVALID_PROJECT_NAME" ||
        error.message === "INVALID_PROJECT_DESCRIPTION"
      ) {
        return res.status(400).json({
          message:
            error.message === "INVALID_PROJECT_NAME"
              ? "Project name must be between 2 and 120 characters."
              : error.message === "INVALID_PROJECT_DESCRIPTION"
                ? "Description cannot exceed 2000 characters."
                : "A valid project name and description are required.",
        });
      }
    }

    console.error("Project update failed:", error);

    return res.status(500).json({
      message: "Failed to update project.",
    });
  }
}

export async function deleteProjectHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const project = await deleteProject(
      req.params.projectId as string,
      req.auth,
    );

    return res.status(200).json({
      message: "Project deleted successfully.",
      project,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_AUTH_CONTEXT") {
        return res.status(401).json({
          message: "Invalid authentication context.",
        });
      }

      if (error.message === "PROJECT_DELETE_FORBIDDEN") {
        return res.status(403).json({
          message: "You do not have permission to delete projects.",
        });
      }

      if (error.message === "INVALID_PROJECT_ID") {
        return res.status(400).json({
          message: "Invalid project ID.",
        });
      }

      if (error.message === "PROJECT_NOT_FOUND") {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      if (error.message === "PROJECT_HAS_TASKS") {
        return res.status(409).json({
          message:
            "This project still has tasks. Delete or move its tasks before deleting the project.",
        });
      }
    }

    console.error("Project deletion failed:", error);

    return res.status(500).json({
      message: "Failed to delete project.",
    });
  }
}

