
import mongoose from "mongoose";
import Company from "../models/Company.js";

export async function getWorkspaceSettings(companyId: string) {
  if (!mongoose.isValidObjectId(companyId)) {
    throw new Error("INVALID_COMPANY_ID");
  }

  const company = await Company.findOne({
    _id: companyId,
    isActive: true,
  })
    .select("name description logo createdAt updatedAt")
    .lean();

  if (!company) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  return company;
}


export async function updateWorkspaceSettings(
  companyId: string,
  data: {
    name?: string;
    description?: string;
    logo?: string;
  },
) {
  if (!mongoose.isValidObjectId(companyId)) {
    throw new Error("INVALID_COMPANY_ID");
  }

  const updates: {
    name?: string;
    description?: string;
    logo?: string;
  } = {};

  if (data.name !== undefined) {
    const name = data.name.trim();

    if (name.length < 2 || name.length > 100) {
      throw new Error("INVALID_COMPANY_NAME");
    }

    updates.name = name;
  }

  if (data.description !== undefined) {
    const description = data.description.trim();

    if (description.length > 500) {
      throw new Error("INVALID_COMPANY_DESCRIPTION");
    }

    updates.description = description;
  }

  if (data.logo !== undefined) {
    const logo = data.logo.trim();

    if (logo.length > 2048) {
      throw new Error("INVALID_COMPANY_LOGO");
    }

    updates.logo = logo;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("NO_SETTINGS_TO_UPDATE");
  }

  const company = await Company.findOneAndUpdate(
    { _id: companyId, isActive: true },
    { $set: updates },
    { new: true, runValidators: true },
  )
    .select("name description logo createdAt updatedAt")
    .lean();

  if (!company) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  return company;
}
