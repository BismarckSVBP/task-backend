import { Router, Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { scheduleEmail } from "../controllers/email";

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  req.user = verifyToken(token) as any;
  next();
});

router.post("/schedule", scheduleEmail);

export default router;
