import express, { Application } from "express";
import dotenv from "dotenv";
import fileRoutes from "./routes/file.routes";
import cors from "cors";
import morgan from "morgan";

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

// API Routes
app.use("/api/auth/avatar_url", fileRoutes);

const PORT = process.env.PORT || 3010;

app.listen(PORT, () =>
  console.log(`File service running on http://localhost:${PORT}`),
);
