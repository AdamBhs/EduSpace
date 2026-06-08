import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";
import { setupSocket } from "./socket/handler";
import chatRoutes from "./routes/chat.routes";
import dmRoutes from "./routes/dm.routes";
import { startConsumers } from "./events/consumer";

const app: Application = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

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
    service: "communication-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/chat", chatRoutes);
app.use("/api/dm", dmRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

setupSocket(io);

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`Communication service running on http://localhost:${PORT}`);
  startConsumers().catch((err) => {
    console.error("Failed to start RabbitMQ consumers:", err.message);
  });
});
