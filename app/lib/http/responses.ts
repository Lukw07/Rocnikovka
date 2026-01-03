/**
 * Standard success response wrapper
 */
export function createSuccessResponse<T>(data: T, requestId?: string, status?: number) {
  return {
    ok: true,
    data,
    requestId
  }
}

/**
 * Collection of standard error responses
 */
export const ErrorResponses = {
  /**
   * Missing authentication
   */
  UNAUTHORIZED: (requestId?: string) => ({
    ok: false,
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    requestId
  }),

  /**
   * Insufficient permissions
   */
  FORBIDDEN: (requestId?: string) => ({
    ok: false,
    code: 'FORBIDDEN',
    message: 'Access denied',
    requestId
  }),

  /**
   * Resource not found
   */
  NOT_FOUND: (message: string = "Resource not found", requestId?: string) => ({
    ok: false,
    code: 'NOT_FOUND',
    message,
    requestId
  }),

  /**
   * Validation error
   */
  VALIDATION_ERROR: (message: string = "Validation failed", details?: any, requestId?: string) => ({
    ok: false,
    code: 'VALIDATION_ERROR',
    message,
    requestId,
    details
  }),

  /**
   * Bad request
   */
  BAD_REQUEST: (message: string = "Invalid request", requestId?: string) => ({
    ok: false,
    code: 'BAD_REQUEST',
    message,
    requestId
  }),

  /**
   * Conflict (e.g., resource already exists)
   */
  CONFLICT: (message: string = "Conflict", requestId?: string) => ({
    ok: false,
    code: 'CONFLICT',
    message,
    requestId
  }),

  /**
   * Rate limit exceeded
   */
  RATE_LIMIT_EXCEEDED: (requestId?: string) => ({
    ok: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
    requestId
  }),

  /**
   * Internal server error
   */
  INTERNAL_SERVER_ERROR: (message: string = "Internal server error", requestId?: string) => ({
    ok: false,
    code: 'INTERNAL_SERVER_ERROR',
    message,
    requestId
  }),

  /**
   * Service unavailable
   */
  SERVICE_UNAVAILABLE: (message: string = "Service unavailable", requestId?: string) => ({
    ok: false,
    code: 'SERVICE_UNAVAILABLE',
    message,
    requestId
  })
}
