import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error: any) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
