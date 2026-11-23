
import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["planning", "in_progress", "completed", "archived"],
      default: "planning",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

projectSchema.index({ companyId: 1, createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
