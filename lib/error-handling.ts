/**
 * Error Handling and Logging Utilities
 * Provides comprehensive error handling, logging, and user-friendly error messages
 */

import { NextApiRequest, NextApiResponse } from 'next';

// Error types for authentication flows
export enum AuthErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SESSION_ERROR = 'SESSION_ERROR',
  SECURITY_ERROR = 'SECURITY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
  statusCode: number;
  userMessage: string;
  shouldRetry: boolean;
  errorCode?: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  error?: any;
  metadata?: any;
}

/**
 * Authentication Error Class
 */
export class AuthenticationError extends Error {
  public readonly type: AuthErrorType;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly shouldRetry: boolean;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    type: AuthErrorType,
    message: string,
    statusCode: number = 500,
    userMessage?: string,
    shouldRetry: boolean = false,
    errorCode?: string,
    details?: any
  ) {
    super(message);
    this.name = 'AuthenticationError';
    this.type = type;
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.shouldRetry = shouldRetry;
    this.errorCode = errorCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }

  private getDefaultUserMessage(type: AuthErrorType): string {
    switch (type) {
      case AuthErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case AuthErrorType.AUTHENTICATION_FAILED:
        return 'Invalid email or password. Please try again.';
      case AuthErrorType.AUTHORIZATION_FAILED:
        return 'You do not have permission to access this resource.';
      case AuthErrorType.RATE_LIMITED:
        return 'Too many attempts. Please try again later.';
      case AuthErrorType.DATABASE_ERROR:
        return 'Service temporarily unavailable. Please try again later.';
      case AuthErrorType.EMAIL_SERVICE_ERROR:
        return 'Unable to send email. Please try again later.';
      case AuthErrorType.SESSION_ERROR:
        return 'Your session has expired. Please sign in again.';
      case AuthErrorType.SECURITY_ERROR:
        return 'Security validation failed. Please try again.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      type: this.type,
      message: this.userMessage,
      errorCode: this.errorCode,
      shouldRetry: this.shouldRetry,
      details: process.env.NODE_ENV === 'development' ? this.details : undefined,
    };
  }
}

/**
 * Logger Class
 */
export class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    metadata?: any
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const context = entry.userId ? `[User: ${entry.userId}]` : '';
    const endpoint = entry.endpoint ? `[${entry.method} ${entry.endpoint}]` : '';
    
    return `${prefix} ${context} ${endpoint} ${entry.message}`;
  }

  info(message: string, metadata?: any): void {
    const entry = this.createLogEntry('info', message, metadata);
    this.addToBuffer(entry);
    console.log(this.formatConsoleMessage(entry));
  }

  warn(message: string, metadata?: any): void {
    const entry = this.createLogEntry('warn', message, metadata);
    this.addToBuffer(entry);
    console.warn(this.formatConsoleMessage(entry));
  }

  error(message: string, error?: any, metadata?: any): void {
    const entry = this.createLogEntry('error', message, { ...metadata, error });
    this.addToBuffer(entry);
    console.error(this.formatConsoleMessage(entry), error);
  }

  debug(message: string, metadata?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('debug', message, metadata);
      this.addToBuffer(entry);
      console.debug(this.formatConsoleMessage(entry));
    }
  }

  authEvent(
    event: string,
    userId?: string,
    email?: string,
    ip?: string,
    metadata?: any
  ): void {
    const entry = this.createLogEntry('info', `Auth Event: ${event}`, {
      userId,
      email,
      ip,
      ...metadata,
    });
    entry.userId = userId;
    entry.email = email;
    entry.ip = ip;
    
    this.addToBuffer(entry);
    console.log(this.formatConsoleMessage(entry));
  }

  securityEvent(
    event: string,
    level: 'warn' | 'error' = 'warn',
    ip?: string,
    metadata?: any
  ): void {
    const entry = this.createLogEntry(level, `Security Event: ${event}`, {
      ip,
      ...metadata,
    });
    entry.ip = ip;
    
    this.addToBuffer(entry);
    
    if (level === 'error') {
      console.error(this.formatConsoleMessage(entry));
    } else {
      console.warn(this.formatConsoleMessage(entry));
    }
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  clearLogs(): void {
    this.logBuffer = [];
  }
}

/**
 * Error Handler for API Routes
 */
export function createErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  const logger = Logger.getInstance();

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const clientIP = getClientIP(req);
    const userAgent = req.headers ? req.headers['user-agent'] : '';
    if (!req.headers) {
      console.warn('Request headers are undefined');
    }

    // Add request context to logger
    const logContext = {
      endpoint: req.url,
      method: req.method,
      ip: clientIP,
      userAgent,
    };

    logger.debug('API Request started', logContext);

    try {
      await handler(req, res);
      
      const duration = Date.now() - startTime;
      logger.info('API Request completed', {
        ...logContext,
        duration,
        statusCode: res.statusCode,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof AuthenticationError) {
        // Handle known authentication errors
        logger.warn('Authentication error occurred', {
          ...logContext,
          duration,
          errorType: error.type,
          errorCode: error.errorCode,
          userMessage: error.userMessage,
        });

        if (!res.headersSent) {
          res.status(error.statusCode).json({
            success: false,
            error: error.type,
            message: error.userMessage,
            errorCode: error.errorCode,
            shouldRetry: error.shouldRetry,
            ...(process.env.NODE_ENV === 'development' && {
              details: error.details,
              stack: error.stack,
            }),
          });
        }
      } else {
        // Handle unknown errors
        logger.error('Unexpected error occurred', error, {
          ...logContext,
          duration,
        });

        // Log security event for potential attacks - only if response has been handled
        if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500) {
          logger.securityEvent('Client error', 'warn', clientIP, {
            statusCode: res.statusCode,
            endpoint: req.url,
            method: req.method,
          });
        }

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: AuthErrorType.UNKNOWN_ERROR,
            message: 'An unexpected error occurred. Please try again later.',
            shouldRetry: true,
            ...(process.env.NODE_ENV === 'development' && {
              details: error.message,
              stack: error.stack,
            }),
          });
        }
      }
    }
  };
}

/**
 * Validation Error Helper
 */
export function createValidationError(
  message: string,
  details?: any
): AuthenticationError {
  return new AuthenticationError(
    AuthErrorType.VALIDATION_ERROR,
    message,
    400,
    message,
    false,
    'VALIDATION_FAILED',
    details
  );
}

/**
 * Rate Limit Error Helper
 */
export function createRateLimitError(
  retryAfter: number,
  attempts: number
): AuthenticationError {
  const minutes = Math.ceil(retryAfter / 60);
  return new AuthenticationError(
    AuthErrorType.RATE_LIMITED,
    `Rate limit exceeded: ${attempts} attempts`,
    429,
    `Too many attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    true,
    'RATE_LIMIT_EXCEEDED',
    { retryAfter, attempts }
  );
}

/**
 * Database Error Helper
 */
export function createDatabaseError(
  operation: string,
  originalError?: any
): AuthenticationError {
  return new AuthenticationError(
    AuthErrorType.DATABASE_ERROR,
    `Database operation failed: ${operation}`,
    503,
    'Service temporarily unavailable. Please try again later.',
    true,
    'DATABASE_UNAVAILABLE',
    originalError
  );
}

/**
 * Email Service Error Helper
 */
export function createEmailError(
  operation: string,
  originalError?: any
): AuthenticationError {
  return new AuthenticationError(
    AuthErrorType.EMAIL_SERVICE_ERROR,
    `Email operation failed: ${operation}`,
    502,
    'Unable to send email. Please try again later.',
    true,
    'EMAIL_SERVICE_UNAVAILABLE',
    originalError
  );
}

/**
 * Authentication Failed Error Helper
 */
export function createAuthenticationError(
  reason?: string
): AuthenticationError {
  return new AuthenticationError(
    AuthErrorType.AUTHENTICATION_FAILED,
    reason || 'Authentication failed',
    401,
    'Invalid email or password. Please try again.',
    false,
    'AUTH_FAILED'
  );
}

/**
 * Session Error Helper
 */
export function createSessionError(
  reason: string
): AuthenticationError {
  return new AuthenticationError(
    AuthErrorType.SESSION_ERROR,
    `Session error: ${reason}`,
    401,
    'Your session has expired. Please sign in again.',
    false,
    'SESSION_EXPIRED'
  );
}

/**
 * Get client IP address
 */
function getClientIP(req: NextApiRequest): string {
  if (!req.headers) return ''
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    (req.connection && req.connection.remoteAddress) ||
    (req.socket && req.socket.remoteAddress) ||
    ''
  ).split(',')[0].trim()
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeError(error: any): any {
  if (!error) return error;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  if (typeof error === 'string') {
    let sanitized = error;
    sensitiveFields.forEach(field => {
      const regex = new RegExp(`${field}[\\s\\W]*[\\w\\d]+`, 'gi');
      sanitized = sanitized.replace(regex, `${field}: [REDACTED]`);
    });
    return sanitized;
  }

  if (typeof error === 'object') {
    const sanitized = { ...error };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  return error;
}

/**
 * Format error for user display
 */
export function formatUserError(error: any): {
  message: string;
  type: string;
  shouldRetry: boolean;
} {
  if (error instanceof AuthenticationError) {
    return {
      message: error.userMessage,
      type: error.type,
      shouldRetry: error.shouldRetry,
    };
  }

  // Handle common errors
  if (error.code === 'ECONNREFUSED') {
    return {
      message: 'Unable to connect to our services. Please try again later.',
      type: AuthErrorType.NETWORK_ERROR,
      shouldRetry: true,
    };
  }

  if (error.code === 'ENOTFOUND') {
    return {
      message: 'Network error. Please check your connection and try again.',
      type: AuthErrorType.NETWORK_ERROR,
      shouldRetry: true,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again later.',
    type: AuthErrorType.UNKNOWN_ERROR,
    shouldRetry: true,
  };
}

// Export singleton logger instance
export const logger = Logger.getInstance();
