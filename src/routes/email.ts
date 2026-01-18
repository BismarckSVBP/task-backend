import { Router } from "express";
import {
  scheduleEmail,
  getScheduledEmails,
  getSentEmails,
} from "../controllers/email";
import { verifyToken } from "../utils/auth";

const router = Router();

router.use((req: any, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  req.user = verifyToken(token);
  next();
});

router.post("/schedule", scheduleEmail);
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);

export default router;
