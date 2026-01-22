/**
 * Error Utilities
 *
 * Standardized error response helpers for consistent API responses.
 *
 * @module api/utils/errors
 */

import { Response } from 'express';

// =============================================================================
// Types
// =============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

// =============================================================================
// Error Response Helper
// =============================================================================

/**
 * Send a standardized error response
 *
 * @param res - Express response object
 * @param status - HTTP status code
 * @param error - Human-readable error message
 * @param code - Optional machine-readable error code
 */
export function sendError(
  res: Response,
  status: number,
  error: string,
  code?: ErrorCode
): void {
  const response: ErrorResponse = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  res.status(status).json(response);
}

// =============================================================================
// Convenience Methods
// =============================================================================

/**
 * Send a 400 Bad Request error
 */
export function badRequest(res: Response, error: string): void {
  sendError(res, 400, error, 'BAD_REQUEST');
}

/**
 * Send a 401 Unauthorized error
 */
export function unauthorized(res: Response, error = 'Authentication required'): void {
  sendError(res, 401, error, 'UNAUTHORIZED');
}

/**
 * Send a 403 Forbidden error
 */
export function forbidden(res: Response, error = 'Access denied'): void {
  sendError(res, 403, error, 'FORBIDDEN');
}

/**
 * Send a 404 Not Found error
 */
export function notFound(res: Response, resource = 'Resource'): void {
  sendError(res, 404, `${resource} not found`, 'NOT_FOUND');
}

/**
 * Send a 409 Conflict error
 */
export function conflict(res: Response, error: string): void {
  sendError(res, 409, error, 'CONFLICT');
}

/**
 * Send a 422 Validation error
 */
export function validationError(res: Response, error: string): void {
  sendError(res, 422, error, 'VALIDATION_ERROR');
}

/**
 * Send a 429 Rate Limited error
 */
export function rateLimited(res: Response, error = 'Too many requests'): void {
  sendError(res, 429, error, 'RATE_LIMITED');
}

/**
 * Send a 500 Internal Server Error
 */
export function internalError(res: Response, error = 'Internal server error'): void {
  sendError(res, 500, error, 'INTERNAL_ERROR');
}

// =============================================================================
// Error Handler Wrapper
// =============================================================================

/**
 * Wrap an async route handler to catch errors and send standardized responses
 *
 * @param handler - Async route handler function
 * @param errorMessage - Message to show on error (default: 'Internal server error')
 */
export function asyncHandler<T>(
  handler: (req: any, res: Response) => Promise<T>,
  errorMessage = 'Internal server error'
) {
  return async (req: any, res: Response): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      internalError(res, errorMessage);
    }
  };
}
