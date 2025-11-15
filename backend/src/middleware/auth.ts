import { Request, Response, NextFunction } from "express";
import { User } from "../data";
import { verifyToken } from "../utils/token";
import { users } from "../data";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication middleware
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    // Find the user by ID
    const user = users.find(u => u.id === decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

// Authorization middleware: ensures user has one of the given roles
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}
