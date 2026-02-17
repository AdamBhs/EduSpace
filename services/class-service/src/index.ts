// src/index.ts
import express, {
  Application,
  NextFunction,
  Request,
  Response,
} from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
app.use("/api/auth", authRoutes);
app.use("/api/classes", userRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Class service running on port http://localhost:${PORT}`);
});
