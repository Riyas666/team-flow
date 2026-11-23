
import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "project_created",
        "project_updated",
        "task_created",
        "task_assigned",
        "task_status_updated",
        "task_updated",
        "task_deleted"
      ],
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    details: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ companyId: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
