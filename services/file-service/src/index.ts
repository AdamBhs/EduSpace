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
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
