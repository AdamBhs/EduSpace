import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { setupProxies } from "./proxy";
import { rateLimiter } from "./rateLimit";
import { authenticate } from "./auth";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
});

app.use(rateLimiter);
app.use(authenticate);

app.use((req: Request, res: Response, next) => {
  if (/\/internal(\/|$)/.test(req.path)) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  if (/^\/chat\/api\/chat\/rooms(\/|$)/.test(req.path)) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  next();
});

setupProxies(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
