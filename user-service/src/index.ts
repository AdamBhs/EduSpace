import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();

app.use(morgan("dev")); // morgan is just to see the URL requests

// Middlewares
app.use(cors());
app.use(express.json());



app.get("/users", (req: Request, res: Response) => {
  res.json([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);
});

// Server
const PORT = parseInt(process.env.PORT || "3002", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`User service running on port http://localhost:${PORT}`);
});
