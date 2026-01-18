import jwt from 'jsonwebtoken';

const SECRET = process.env.SESSION_SECRET || 'supersecretkey';

export const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};
