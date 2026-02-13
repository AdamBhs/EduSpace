import express from "express";
import dotenv from "dotenv";
import fileRoutes from "./routes/file.routes";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/files", fileRoutes);


const PORT = process.env.PORT || 3010;

app.listen(PORT, () => console.log(`File service running on ${PORT}`));