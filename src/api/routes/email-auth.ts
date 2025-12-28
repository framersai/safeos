/**
 * Email Authentication Routes
 *
 * API endpoints for full email/password authentication.
 *
 * @module api/routes/email-auth
 */

import { Router } from 'express';
import { emailAuthService } from '../../auth/email-auth.js';
import { authLimiter, strictLimiter } from '../middleware/rate-limiter.js';

export const emailAuthRouter = Router();

// Apply rate limiting to auth routes
emailAuthRouter.use(authLimiter);

/**
 * POST /api/auth/email/register
 * Register a new user with email and password
 */
emailAuthRouter.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    const result = await emailAuthService.register({ email, password, displayName });

    if (!result.success) {
      return res.status(400).json({
        error: 'Registration failed',
        message: result.error,
      });
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        displayName: result.user!.displayName,
        emailVerified: result.user!.emailVerified,
      },
    });
  } catch (error) {
    console.error('[EmailAuth] Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user',
    });
  }
});

/**
 * POST /api/auth/email/login
 * Login with email and password
 */
emailAuthRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    const result = await emailAuthService.login({ email, password });

    if (!result.success) {
      return res.status(401).json({
        error: 'Login failed',
        message: result.error,
      });
    }

    res.json({
      message: 'Login successful',
      sessionToken: result.sessionToken,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        displayName: result.user!.displayName,
        role: result.user!.role,
      },
    });
  } catch (error) {
    console.error('[EmailAuth] Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
});

/**
 * POST /api/auth/email/verify
 * Verify email with token
 */
emailAuthRouter.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Verification token is required',
      });
    }

    const result = await emailAuthService.verifyEmail(token);

    if (!result.success) {
      return res.status(400).json({
        error: 'Verification failed',
        message: result.error,
      });
    }

    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('[EmailAuth] Verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify email',
    });
  }
});

/**
 * POST /api/auth/email/forgot-password
 * Request password reset
 */
emailAuthRouter.post('/forgot-password', strictLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'Email address is required',
      });
    }

    await emailAuthService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[EmailAuth] Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process password reset request',
    });
  }
});

/**
 * POST /api/auth/email/reset-password
 * Reset password with token
 */
emailAuthRouter.post('/reset-password', strictLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Token and new password are required',
      });
    }

    const result = await emailAuthService.resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json({
        error: 'Reset failed',
        message: result.error,
      });
    }

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[EmailAuth] Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reset password',
    });
  }
});

/**
 * POST /api/auth/email/change-password
 * Change password (when logged in)
 */
emailAuthRouter.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const token = authHeader.slice(7);
    const user = await emailAuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required',
      });
    }

    const result = await emailAuthService.changePassword(
      user.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'Change failed',
        message: result.error,
      });
    }

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[EmailAuth] Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to change password',
    });
  }
});

/**
 * POST /api/auth/email/logout
 * Logout (invalidate session)
 */
emailAuthRouter.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      await emailAuthService.logout(token);
    }

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[EmailAuth] Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout',
    });
  }
});

/**
 * POST /api/auth/email/logout-all
 * Logout from all devices
 */
emailAuthRouter.post('/logout-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const token = authHeader.slice(7);
    const user = await emailAuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session',
      });
    }

    await emailAuthService.logoutAll(user.id);

    res.json({
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('[EmailAuth] Logout all error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout from all devices',
    });
  }
});

/**
 * GET /api/auth/email/me
 * Get current authenticated user
 */
emailAuthRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const token = authHeader.slice(7);
    const user = await emailAuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session',
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('[EmailAuth] Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user',
    });
  }
});

export default emailAuthRouter;







