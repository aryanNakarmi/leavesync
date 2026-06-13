import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/database";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api", routes);

async function start() {
  await connectDB();
  
  app.listen(PORT, () => {  
    console.log(`✓ Backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
