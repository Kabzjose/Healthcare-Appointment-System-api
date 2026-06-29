import winston from 'winston';
import { env } from './env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// ── Custom format for development (human-readable, coloured) ──────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }), // includes stack trace on errors
  printf(({ timestamp, level, message, stack, ...meta }) => {
    // If there's extra data passed (e.g. logger.info('msg', { userId })), print it
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${stack ?? message}${metaStr}`;
  })
);

// ── Format for production (structured JSON — easy to query in log tools) ──────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json() // outputs: { "level": "info", "message": "...", "timestamp": "..." }
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL, // only log messages at this level and above
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    // Always write to console
    new winston.transports.Console(),

    // In production, also write errors to a file
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});