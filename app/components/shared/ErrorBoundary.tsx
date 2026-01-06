"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { motion } from "framer-motion"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo?: React.ErrorInfo; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false 
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error 
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    })

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error("🔴 ErrorBoundary caught an error:", error)
      console.error("📋 Error details:", errorInfo)
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // You can also send to error reporting service here
    // this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Example: Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo })
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined,
      errorInfo: undefined 
    })
  }

  reloadPage = () => {
    window.location.reload()
  }

  goHome = () => {
    window.location.href = '/'
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error!} 
            errorInfo={this.state.errorInfo}
            resetError={this.resetError} 
          />
        )
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md shadow-2xl border-red-200 dark:border-red-800">
              <CardHeader className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex justify-center"
                >
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </motion.div>
                <div className="space-y-2">
                  <CardTitle className="text-xl text-red-600 dark:text-red-400">
                    Došlo k chybě
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                    Omlouváme se, ale nastala neočekávaná chyba aplikace.
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Error details for development */}
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ delay: 0.3 }}
                    className="text-sm"
                  >
                    <details className="cursor-pointer border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <summary className="p-3 text-slate-700 dark:text-slate-300 font-medium flex items-center">
                        <Bug className="h-4 w-4 mr-2" />
                        Technické detaily (pouze vývoj)
                      </summary>
                      <div className="p-3 border-t bg-white dark:bg-slate-900 rounded-b-lg">
                        <div className="mb-2">
                          <strong className="text-red-600">Chyba:</strong>
                          <div className="text-xs font-mono mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                            {this.state.error.message}
                          </div>
                        </div>
                        {this.state.error.stack && (
                          <div>
                            <strong className="text-red-600">Stack trace:</strong>
                            <pre className="text-xs font-mono mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded overflow-auto max-h-32">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <strong className="text-red-600">Component stack:</strong>
                            <pre className="text-xs font-mono mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded overflow-auto max-h-32">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    onClick={this.resetError}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Zkusit znovu
                  </Button>
                  
                  <Button 
                    onClick={this.reloadPage}
                    variant="default"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Obnovit stránku
                  </Button>
                  
                  <Button 
                    onClick={this.goHome}
                    variant="ghost"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Domů
                  </Button>
                </motion.div>

                {/* Help text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-sm text-slate-500 dark:text-slate-400 space-y-1"
                >
                  <p>Pokud chyba přetrvává, kontaktujte podporu.</p>
                  <p>Kód chyby: <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                    {this.state.error?.name || 'UNKNOWN_ERROR'}
                  </span></p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Custom hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error)
    setError(error)
    
    // You can also send to error reporting service here
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error)
    }
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    resetError,
    hasError: !!error
  }
}

// Higher Order Component for error handling
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Custom fallback component example
export function CustomErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error
  resetError: () => void 
}) {
  return (
    <div className="p-4 text-center">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={resetError}>Try again</Button>
    </div>
  )
}
