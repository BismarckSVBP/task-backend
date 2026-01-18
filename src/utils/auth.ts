import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET!;

export interface JwtPayload {
  id: string;
  email: string;
}

export function generateToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
