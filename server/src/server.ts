import "dotenv/config";
import express from "express";
import cors from "cors"
import { connectDB } from "./config/db.js";
import Company from "./models/Company.js";
import authRoutes from "./routes/auth.routes.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "./middleware/auth.middleware.js";
import { authorize } from "./middleware/authorize.middleware.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import memberRoutes from "./routes/member.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";


const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/projects", projectRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/members", memberRoutes);

app.use("/api/invitations", invitationRoutes);

app.use("/api/activities", activityRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "TeamFlow API is running",
  });
});

app.post("/test/company", async(_req, res) =>{
  try{
    const company = await Company.create({
      name : "TeamFlow Test Company",
      description: "Temporary test company"
    })

    res.status(201).json(company);
  }catch(error){
    console.error(error);
    res.status(500).json({
      message: "Failed to create company",
    });
  }
} )

app.use("/api/auth", authRoutes)

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TeamFlow server running on port ${PORT}`);
  });
});

app.get("/api/auth/me", requireAuth,
  (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      message: "Authentication successful",
      auth: req.auth,
    })
  }
)
app.get(
  "/api/auth/owner-test",
  requireAuth,
  authorize("owner"),
  (_req, res) => {
    res.status(200).json({
      message: "Owner access granted.",
    });
  },
);
