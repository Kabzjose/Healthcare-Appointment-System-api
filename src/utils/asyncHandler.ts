import { Request, Response, NextFunction } from 'express';

// Wraps an async route handler so any thrown error is passed to next()
// Without this, an unhandled promise rejection in a route would crash the process

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
    // .catch(next) passes the error to Express's error middleware
  };
};