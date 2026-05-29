import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "../../../shared/src/middleware/errorHandler";
import { ensureIndex } from "./utils/elastic";
import searchRoutes from "./routes/search.routes";
import { startConsumers } from "./events/consumer";

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
    service: "search-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/search", searchRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3007;

ensureIndex()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Search service running on http://localhost:${PORT}`);
      startConsumers().catch((err) => {
        console.error("Failed to start RabbitMQ consumers:", err.message);
      });
    });
  })
  .catch((err) => {
    console.error("Failed to initialize Elasticsearch index:", err);
    process.exit(1);
  });
