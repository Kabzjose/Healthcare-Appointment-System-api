import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../database/db';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/ApiError';
import { UserRow, JwtPayload, PublicUser } from '../../types';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './auth.schemas';

// ── Token helpers ─────────────────────────────────────────────────────────────
const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

// Strip sensitive fields before returning user to client
const toPublicUser = (user: UserRow): PublicUser => {
  const { password_hash, ...publicUser } = user;
  return publicUser;
};

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (
  input: RegisterInput
): Promise<{ user: PublicUser; access_token: string; refresh_token: string }> => {
  // Check if email already exists
  const existing = await db.query<UserRow>(
    'SELECT id FROM users WHERE email = $1',
    [input.email]
  );

  if (existing.rows.length > 0) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Hash password — 12 rounds is the recommended balance of security vs speed
  const password_hash = await bcrypt.hash(input.password, 12);

  // Insert new user
  const result = await db.query<UserRow>(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.email, password_hash, input.first_name, input.last_name, input.phone ?? null, input.role]
  );

  const user = result.rows[0];

  logger.info('User registered', { userId: user.id, role: user.role });

  // Generate tokens immediately so user is logged in after registering
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    user: toPublicUser(user),
    access_token: generateAccessToken(tokenPayload),
    refresh_token: generateRefreshToken(tokenPayload),
  };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (
  input: LoginInput
): Promise<{ user: PublicUser; access_token: string; refresh_token: string }> => {
  // Fetch user — select password_hash because we need it to compare
  const result = await db.query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [input.email]
  );

  const user = result.rows[0];

  // Use the same generic message whether email or password is wrong
  // Telling an attacker "email not found" helps them enumerate accounts
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  // Compare supplied password against stored hash
  const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  logger.info('User logged in', { userId: user.id, role: user.role });

  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    user: toPublicUser(user),
    access_token: generateAccessToken(tokenPayload),
    refresh_token: generateRefreshToken(tokenPayload),
  };
};

// ── Refresh access token ──────────────────────────────────────────────────────
export const refreshToken = async (
  input: RefreshTokenInput
): Promise<{ access_token: string }> => {
  try {
    const decoded = jwt.verify(input.refresh_token, env.JWT_REFRESH_SECRET) as JwtPayload;

    // Confirm user still exists and is active
    const result = await db.query<UserRow>(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User not found or deactivated');
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token: newAccessToken };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Refresh token has expired, please log in again');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    throw err;
  }
};

// ── Change password ───────────────────────────────────────────────────────────
export const changePassword = async (
  userId: string,
  input: ChangePasswordInput
): Promise<void> => {
  const result = await db.query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  const user = result.rows[0];
  if (!user) throw ApiError.notFound('User not found');

  const isCurrentPasswordValid = await bcrypt.compare(
    input.current_password,
    user.password_hash
  );

  if (!isCurrentPasswordValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(input.new_password, 12);

  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    newHash,
    userId,
  ]);

  logger.info('Password changed', { userId });
};