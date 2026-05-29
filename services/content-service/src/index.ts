import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";
import postRoutes from "./routes/post.routes";
import commentRoutes from "./routes/comment.routes";
import submissionRoutes from "./routes/submission.routes";
import gradeRoutes from "./routes/grade.routes";
import { startConsumers } from "./events/consumer";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "content-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/grades", gradeRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Content service running on http://localhost:${PORT}`);
  startConsumers().catch((err) => {
    console.error("Failed to start RabbitMQ consumers:", err.message);
  });
});
