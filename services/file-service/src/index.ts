import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";
import { ensureBucket } from "./services/s3";
import fileRoutes from "./routes/file.routes";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "file-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/files", fileRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3010;

ensureBucket()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`File service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize S3 bucket:", err);
    process.exit(1);
  });
