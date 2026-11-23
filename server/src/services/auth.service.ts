
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export async function registerOwner(input: RegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();

  if (!name || !email || !companyName || !input.password) {
    throw new Error("VALIDATION_REQUIRED_FIELDS");
  }

  if (name.length < 2 || name.length > 100) {
    throw new Error("VALIDATION_NAME");
  }

  if (companyName.length < 2 || companyName.length > 100) {
    throw new Error("VALIDATION_COMPANY_NAME");
  }

  if (input.password.length < 8 || input.password.length > 72) {
    throw new Error("VALIDATION_PASSWORD");
  }


  if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  email.length > 254
) {
  throw new Error("VALIDATION_EMAIL");
}

  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const session = await mongoose.startSession();

  try {
    let createdUserId: mongoose.Types.ObjectId | undefined;

    await session.withTransaction(async () => {
      const [company] = await Company.create(
        [
          {
            name: companyName,
          },
        ],
        { session },
      );

      if(!company){
        throw new Error("REGISTRATION_FAILED")
      }

      const [user] = await User.create(
        [
          {
            name,
            email,
            passwordHash,
            companyId: company._id,
            role: "owner",
          },
        ],
        { session },
      );

      if(!user){
        throw new Error("Registration_failed")
      }

      createdUserId = user._id;
    });

    if (!createdUserId) {
      throw new Error("REGISTRATION_FAILED");
    }

    const user = await User.findById(createdUserId)
      .select("name email companyId role createdAt")
      .lean();

    if (!user) {
      throw new Error("REGISTRATION_FAILED");
    }

    return user;
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

interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = await User.findOne({ email })
    .select("+passwordHash");

  if (!user || !user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("AUTH_CONFIGURATION_ERROR");
  }

  const token = jwt.sign(
  {
    companyId: user.companyId.toString(),
    role: user.role,
  },
  jwtSecret,
  {
    algorithm: "HS256",
    expiresIn: "15m",
    subject: user._id.toString(),
  },
);

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      companyId: user.companyId.toString(),
      role: user.role,
    },
  };
}
