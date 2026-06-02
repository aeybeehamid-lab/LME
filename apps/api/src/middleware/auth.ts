import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthUser, UserRole } from "@lme/types";
import { config } from "../config";
import { AppError } from "./errorHandler";

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required.", "UNAUTHORIZED");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = payload;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(401, "Invalid or expired token.", "UNAUTHORIZED"));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, "Authentication required.", "UNAUTHORIZED");
      }
      if (!roles.includes(req.user.role)) {
        throw new AppError(403, "Insufficient permissions.", "FORBIDDEN");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
