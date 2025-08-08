/**
 * Error Handling Utility
 * Centralized error handling and logging for the game
 */

export class ErrorHandler {
  static logLevel = 'info'; // debug, info, warn, error
  static errorCounts = new Map();
  static maxErrorsPerType = 10;

  /**
   * Handle non-critical errors
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   */
  static handleError(error, context = '') {
    const errorKey = `${context}:${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    
    // Prevent error spam
    if (count >= this.maxErrorsPerType) {
      return;
    }
    
    this.errorCounts.set(errorKey, count + 1);
    
    console.warn(`🚨 [${context}] Error:`, error.message);
    
    if (this.logLevel === 'debug') {
      console.trace(error);
    }
    
    this.handleSpecificErrors(error, context);
  }

  /**
   * Handle critical errors that may break the game
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   */
  static handleCriticalError(error, context = '') {
    console.error(`💥 [CRITICAL] [${context}] Error:`, error);
    console.trace(error);
    
    // Could send to error reporting service here
    this.reportError(error, context, 'critical');
  }

  /**
   * Handle specific error types with custom logic
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   */
  static handleSpecificErrors(error, context) {
    if (error.name === 'TypeError' && error.message.includes('canvas')) {
      console.warn('⚠️ Canvas initialization failed. Please refresh the page.');
      return;
    }
    
    if (error.name === 'NotAllowedError') {
      console.info('🔇 Audio autoplay blocked by browser. User interaction required.');
      return;
    }
    
    if (error.message.includes('Failed to load')) {
      console.warn(`📦 Asset loading failed: ${error.message}`);
      return;
    }
    
    if (error.name === 'QuotaExceededError') {
      console.warn('💾 Storage quota exceeded. Clearing cache...');
      this.clearCache();
      return;
    }
  }

  /**
   * Report error to external service (placeholder)
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @param {string} severity - Error severity level
   */
  static reportError(error, context, severity = 'error') {
    // In production, this would send to error reporting service
    // like Sentry, Rollbar, or custom analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${context}: ${error.message}`,
        fatal: severity === 'critical'
      });
    }
  }

  /**
   * Set logging level
   * @param {string} level - Logging level (debug, info, warn, error)
   */
  static setLogLevel(level) {
    this.logLevel = level;
  }

  /**
   * Clear error cache
   */
  static clearCache() {
    this.errorCounts.clear();
    
    // Clear browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  static getErrorStats() {
    const stats = {};
    for (const [key, count] of this.errorCounts) {
      stats[key] = count;
    }
    return stats;
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context for error handling
   * @returns {Function} Wrapped function
   */
  static wrapAsync(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error;
      }
    };
  }

  /**
   * Wrap sync function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context for error handling
   * @returns {Function} Wrapped function
   */
  static wrap(fn, context) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error;
      }
    };
  }

  /**
   * Create error boundary for React-like error handling
   * @param {Function} component - Component function
   * @param {Function} fallback - Fallback function for errors
   * @param {string} context - Error context
   * @returns {Function} Error boundary wrapper
   */
  static createErrorBoundary(component, fallback, context) {
    return (...args) => {
      try {
        return component(...args);
      } catch (error) {
        this.handleError(error, context);
        return fallback ? fallback(error) : null;
      }
    };
  }
}