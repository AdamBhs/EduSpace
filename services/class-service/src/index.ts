// src/index.ts
import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";

// Import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import classroomRoutes from "./routes/classroom.routes";

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "class-service",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// TODO: Change the end point url to /api
app.use("/api/classroom", classroomRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Class service running on port http://localhost:${PORT}`);
});
