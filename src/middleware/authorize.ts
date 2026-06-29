import { Response, NextFunction } from 'express';
import { UserRole, AuthenticatedRequest } from '../types';
import { ApiError } from '../utils/ApiError';

// Factory — takes allowed roles, returns middleware
// Usage: authorize('admin') or authorize('doctor', 'admin')
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    // authenticate must run before authorize — req.user must exist
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
      return;
    }

    next();
  };
};