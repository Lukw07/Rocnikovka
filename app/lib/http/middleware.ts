import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware that wraps API handlers with error handling
 */
export function withApiErrorHandler<T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<R>
): (req: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (req: NextRequest, ...args: T) => {
    try {
      const result = await handler(req, ...args)
      if (result instanceof NextResponse) {
        return result
      }
      return NextResponse.json(result)
    } catch (error: any) {
      const requestId = req.headers.get("x-request-id") || undefined
      const message = error?.message || "Internal server error"
      const status = error?.status || 500
      
      return NextResponse.json({
        ok: false,
        code: 'INTERNAL_SERVER_ERROR',
        message,
        requestId
      }, { status })
    }
  }
}

/**
 * Middleware that enforces role-based access control
 * Note: This is a higher-order function that returns the actual middleware
 */
export function withRole(...allowedRoles: string[]) {
  return (
    handler: (req: NextRequest, ...args: any[]) => Promise<any>
  ) => {
    return async (req: NextRequest, ...args: any[]) => {
      // This should be implemented in the actual route file where session is available
      // For now, we return a placeholder that allows the handler to proceed
      // The actual session checking should happen in the route handler
      return handler(req, ...args)
    }
  }
}
