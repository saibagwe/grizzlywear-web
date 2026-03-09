import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    admin?: boolean;
  };
}

export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized: No token provided', 401);
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      admin: decodedToken.admin === true,
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    sendError(res, 'Unauthorized: Invalid token', 401);
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.admin) {
    sendError(res, 'Forbidden: Admin access required', 403);
    return;
  }
  next();
}
