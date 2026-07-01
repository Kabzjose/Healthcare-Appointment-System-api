import { Request, Response, NextFunction } from 'express';

// Wraps an async route handler so any thrown error is passed to next()
// Without this, an unhandled promise rejection in a route would crash the process

type AsyncHandler<TRequest extends Request = Request> = (
  req: TRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = <TRequest extends Request>(fn: AsyncHandler<TRequest>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as TRequest, res, next)).catch(next);
    // .catch(next) passes the error to Express's error middleware
  };
};