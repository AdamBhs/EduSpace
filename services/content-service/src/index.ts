// src/index.ts
import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";

// Import routes
import postRoutes from "./routes/post.routes";
import materialRoutes from "./routes/material.routes";
import commentRoutes from "./routes/comment.routes";

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "content-service",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/posts", postRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/comments", commentRoutes);

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
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Content service running on port http://localhost:${PORT}`);
});
