import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";
import notificationRoutes from "./routes/notification.routes";
import { startConsumers } from "./events/consumer";
import { startDueReminderJob } from "./jobs/dueReminder";

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
    service: "notification-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/notifications", notificationRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Notification service running on http://localhost:${PORT}`);
  startConsumers().catch((err) => {
    console.error("Failed to start RabbitMQ consumers:", err.message);
  });
  startDueReminderJob();
});
