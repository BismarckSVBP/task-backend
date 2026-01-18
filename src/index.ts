import "reflect-metadata";
import './worker'; // START WORKER HERE

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import emailRoutes from "./routes/email";
import { configurePassport } from "./config/passport";
import { requeuePendingEmails } from "./services/queue";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(passport.initialize());

configurePassport();

app.use("/auth", authRoutes);
app.use("/api/email", emailRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("ReachInbox API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await requeuePendingEmails();
});

