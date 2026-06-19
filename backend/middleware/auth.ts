import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ghe_uvci_super_secret_key_2026_xyz";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "admin" | "secretaire" | "enseignant";
  };
}

/**
 * Middleware to verify JWT token.
 * Populates req.user with decoded token payload if valid.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Aucun jeton fourni." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Jeton invalide ou expiré." });
  }
}

/**
 * Middleware to restrict route to specific roles.
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Permissions insuffisantes pour cette action." });
    }
    next();
  };
}
