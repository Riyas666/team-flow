
import type { Request, Response } from "express";
import { 
  registerOwner,
  loginUser
 } from "../services/auth.service.js";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, companyName } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof companyName !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, password and company name are required.",
      });
    }

    const user = await registerOwner({
      name,
      email,
      password,
      companyName,
    });

    return res.status(201).json({
      message: "Company and owner registered successfully.",
      user,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const validationMessages: Record<string, string> = {
        VALIDATION_REQUIRED_FIELDS: "All fields are required.",
        VALIDATION_NAME: "Name must be between 2 and 100 characters.",
        VALIDATION_COMPANY_NAME:
          "Company name must be between 2 and 100 characters.",
        VALIDATION_PASSWORD:
          "Password must be between 8 and 72 characters.",
        VALIDATION_EMAIL: "Please provide a valid email address.",
        EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
      };

      const message = validationMessages[error.message];

      if (message) {
        return res.status(
          error.message === "EMAIL_ALREADY_EXISTS" ? 409 : 400,
        ).json({ message });
      }
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const result = await loginUser({ email, password });

    return res.status(200).json({
      message: "Login successful.",
      user: result.user,
      token: result.token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          message: "Invalid email or password.",
        });
      }

      if (error.message === "AUTH_CONFIGURATION_ERROR") {
        console.error("JWT_SECRET is missing or too short.");

        return res.status(500).json({
          message: "Authentication is temporarily unavailable.",
        });
      }
    }

    console.error("Login failed:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
}
