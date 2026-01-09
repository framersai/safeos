/**
 * Authentication Middleware
 *
 * Express middleware for protecting API routes with session validation.
 *
 * @module api/middleware/auth
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getSafeOSDatabase } from '../../db/index.js';

// =============================================================================
// Types
// =============================================================================

interface Session {
  id: string;
  profile_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Extend Express Request to include session data
declare global {
  namespace Express {
    interface Request {
      session?: {
        id: string;
        profileId: string;
        token: string;
        expiresAt: Date;
      };
    }
  }
}

// =============================================================================
// Auth Middleware
// =============================================================================

/**
 * Require a valid session token for the request
 *
 * Expects the token in either:
 * - `x-session-token` header
 * - `Authorization: Bearer <token>` header
 */
export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from headers
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing authentication token',
      });
      return;
    }

    // Validate session
    const db = await getSafeOSDatabase();
    const session = await db.get<Session>(
      `SELECT * FROM sessions WHERE token = ?`,
      [token]
    );

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session token',
      });
      return;
    }

    // Check expiration
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // Clean up expired session
      await db.run(`DELETE FROM sessions WHERE id = ?`, [session.id]);

      res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Your session has expired. Please log in again.',
      });
      return;
    }

    // Attach session to request
    req.session = {
      id: session.id,
      profileId: session.profile_id,
      token: session.token,
      expiresAt,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred while validating your session',
    });
  }
};

/**
 * Optional auth - attaches session if present but doesn't require it
 * Useful for routes that behave differently for authenticated users
 */
export const optionalAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const db = await getSafeOSDatabase();
    const session = await db.get<Session>(
      `SELECT * FROM sessions WHERE token = ?`,
      [token]
    );

    if (session) {
      const expiresAt = new Date(session.expires_at);
      if (expiresAt >= new Date()) {
        req.session = {
          id: session.id,
          profileId: session.profile_id,
          token: session.token,
          expiresAt,
        };
      }
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] Optional auth error:', error);
    // Fail silently for optional auth
    next();
  }
};

/**
 * Require admin role (placeholder for future role system)
 * Currently just requires authentication
 */
export const requireAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First ensure authenticated
  await new Promise<void>((resolve) => {
    requireAuth(req, res, () => resolve());
  });

  if (!req.session) {
    // requireAuth already sent response
    return;
  }

  // TODO: Add role check when role system is implemented
  // For now, just pass through if authenticated
  next();
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Extract authentication token from request
 */
function extractToken(req: Request): string | null {
  // Check x-session-token header first (custom header)
  const sessionToken = req.headers['x-session-token'];
  if (typeof sessionToken === 'string') {
    return sessionToken;
  }

  // Check Authorization header (Bearer token)
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check query param (for WebSocket connections)
  const queryToken = req.query['token'];
  if (typeof queryToken === 'string') {
    return queryToken;
  }

  return null;
}

/**
 * Utility to get profile ID from request (requires auth middleware first)
 */
export function getProfileId(req: Request): string | null {
  return req.session?.profileId || null;
}

export default { requireAuth, optionalAuth, requireAdmin, getProfileId };
