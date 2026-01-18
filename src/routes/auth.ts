import { Router } from "express";
import passport from "passport";
import { generateToken } from "../utils/auth"; // We'll need this utility

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Successful authentication
    const user = req.user as any;
    const token = generateToken(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/auth/success?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          hourlyLimit: user.hourlyLimit,
        }),
      )}`,
    );
  },
);

// Dev Login Route (Bypass Google)
router.get("/dev-login", async (req, res) => {
  try {
    const dummyUser = {
      id: "dev-user-id",
      email: "dev@example.com",
      name: "Developer Mode",
      avatar: "https://via.placeholder.com/150",
      hourlyLimit: 100,
    };

    // Ensure user exists in DB for foreign key constraints
    const prisma = require("../utils/prisma").default;
    await prisma.user.upsert({
      where: { email: dummyUser.email },
      update: {},
      create: {
        ...dummyUser,
        googleId: "dev-mode",
        accessToken: "dev-token",
        refreshToken: "dev-refresh",
      },
    });

    const token = generateToken(dummyUser);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.redirect(
      `${frontendUrl}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(dummyUser))}`,
    );
  } catch (e) {
    console.error(e);
    res.status(500).send("Dev login failed");
  }
});

// Email/Password Signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const prisma = require("../utils/prisma").default;
    const bcrypt = require("bcryptjs");

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        googleId: `email-${Date.now()}`, // Placeholder for unique constraint
      },
    });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Email/Password Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const prisma = require("../utils/prisma").default;
    const bcrypt = require("bcryptjs");

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
      return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
