import { Request, Response } from 'express';
import * as authService from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthenticatedRequest } from '../../types';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './auth.schemas';

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  return ApiResponse.created(res, 'Account created successfully', result);
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  return ApiResponse.ok(res, 'Login successful', result);
});

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body as RefreshTokenInput);
  return ApiResponse.ok(res, 'Token refreshed', result);
});

// ── POST /api/v1/auth/change-password ────────────────────────────────────────
// Protected — requires authenticate middleware on the route
export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.changePassword(req.user.userId, req.body as ChangePasswordInput);
    return ApiResponse.ok(res, 'Password changed successfully');
  }
);

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
// Returns the currently authenticated user's info from the token
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  return ApiResponse.ok(res, 'Authenticated user', {
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role,
  });
});