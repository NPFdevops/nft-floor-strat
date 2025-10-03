import React from 'react';
import { logger, isProduction } from '../config/environment.js';

/**
 * Production-ready Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorId = this.state.errorId;
    
    logger.error(`[ErrorBoundary-${errorId}] React Error Boundary caught an error:`, {
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      props: this.props.logProps ? this.props : 'hidden'
    });

    // Store error details in state for display
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report to external error tracking service in production
    if (isProduction() && window.reportError) {
      try {
        window.reportError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      } catch (reportingError) {
        logger.error('Failed to report error to external service:', reportingError);
      }
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {this.props.title || 'Something went wrong'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.props.message || 'We encountered an unexpected error. Our team has been notified.'}
            </p>

            {!isProduction() && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-32">
                  <div className="text-red-600 font-semibold">Error:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  <div className="text-red-600 font-semibold">Stack:</div>
                  <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Error ID: {this.state.errorId}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Try Again
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Go Home
                </button>
                
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Refresh Page
                </button>
              </div>

              {this.props.showReportButton !== false && (
                <a
                  href={`mailto:support@nftstrategy.fun?subject=Error Report - ${this.state.errorId}&body=Error ID: ${this.state.errorId}%0ATimestamp: ${new Date().toISOString()}%0APlease describe what you were doing when this error occurred.`}
                  className="inline-block text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Report this error
                </a>
              )}
            </div>
          </div>

          {/* Additional context for development */}
          {!isProduction() && (
            <div className="mt-4 text-xs text-gray-500 max-w-md text-center">
              This error boundary is only visible in development. 
              In production, users will see a more user-friendly error message.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for functional components to catch and report async errors
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, context = {}) => {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    logger.error(`[AsyncError-${errorId}] Async error caught:`, {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      errorId
    });

    // Report to external error tracking service in production
    if (isProduction() && window.reportError) {
      try {
        window.reportError({
          message: error.message,
          stack: error.stack,
          context,
          errorId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          type: 'async'
        });
      } catch (reportingError) {
        logger.error('Failed to report async error:', reportingError);
      }
    }

    return errorId;
  }, []);

  return { handleError };
};

/**
 * Higher-order component for wrapping components with error boundaries
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

/**
 * Specialized error boundary for API-related errors
 */
export const APIErrorBoundary = ({ children, onApiError }) => (
  <ErrorBoundary
    title="API Connection Error"
    message="We're having trouble connecting to our services. Please check your internet connection and try again."
    onError={(error, errorInfo, errorId) => {
      if (onApiError) {
        onApiError(error, errorInfo, errorId);
      }
    }}
    fallback={(error, errorInfo, retry) => (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Service Temporarily Unavailable
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                We're experiencing connectivity issues with our data services. 
                This might be temporary - please try again in a few moments.
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={retry}
                className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;