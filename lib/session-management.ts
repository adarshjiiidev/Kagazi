/**
 * Session Management Utilities
 * Provides session validation, refresh token handling, and secure session storage
 */

import { getServerSession } from 'next-auth/next';
import { getSession } from 'next-auth/react';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import jwt from 'jsonwebtoken';

export interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
  };
  expires: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: ExtendedSession;
  error?: string;
  shouldRefresh?: boolean;
}

/**
 * Server-side session validation
 */
export async function validateServerSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionValidationResult> {
  try {
    const session = await getServerSession(req, res, authOptions) as ExtendedSession;
    
    if (!session) {
      return {
        isValid: false,
        error: 'No active session found',
      };
    }

    // Check if session has expired
    const now = new Date();
    const sessionExpiry = new Date(session.expires);
    
    if (now >= sessionExpiry) {
      return {
        isValid: false,
        error: 'Session has expired',
        shouldRefresh: true,
      };
    }

    // Check if email is verified for protected actions
    if (!session.user.emailVerified) {
      return {
        isValid: false,
        error: 'Email verification required',
      };
    }

    // Check if session is close to expiry (within 1 hour)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const shouldRefresh = sessionExpiry <= oneHourFromNow;

    return {
      isValid: true,
      session,
      shouldRefresh,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      isValid: false,
      error: 'Session validation failed',
    };
  }
}

/**
 * Client-side session validation
 */
export async function validateClientSession(): Promise<SessionValidationResult> {
  try {
    const session = await getSession() as ExtendedSession;
    
    if (!session) {
      return {
        isValid: false,
        error: 'No active session found',
      };
    }

    // Check if session has expired
    const now = new Date();
    const sessionExpiry = new Date(session.expires);
    
    if (now >= sessionExpiry) {
      return {
        isValid: false,
        error: 'Session has expired',
        shouldRefresh: true,
      };
    }

    // Check if email is verified
    if (!session.user.emailVerified) {
      return {
        isValid: false,
        error: 'Email verification required',
      };
    }

    // Check if session is close to expiry (within 1 hour)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const shouldRefresh = sessionExpiry <= oneHourFromNow;

    return {
      isValid: true,
      session,
      shouldRefresh,
    };
  } catch (error) {
    console.error('Client session validation error:', error);
    return {
      isValid: false,
      error: 'Session validation failed',
    };
  }
}

/**
 * Require authentication middleware for API routes
 */
export function requireAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, session: ExtendedSession) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const validation = await validateServerSession(req, res);
    
    if (!validation.isValid) {
      return res.status(401).json({
        error: 'Authentication required',
        message: validation.error || 'Please sign in to access this resource',
        shouldRefresh: validation.shouldRefresh,
      });
    }

    // Add session to request for use in handler
    (req as any).session = validation.session;
    
    try {
      await handler(req, res, validation.session!);
    } catch (error) {
      console.error('API handler error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      });
    }
  };
}

/**
 * Require email verification middleware
 */
export function requireEmailVerification(
  handler: (req: NextApiRequest, res: NextApiResponse, session: ExtendedSession) => Promise<void>
) {
  return requireAuth(async (req, res, session) => {
    if (!session.user.emailVerified) {
      return res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource',
      });
    }

    await handler(req, res, session);
  });
}

/**
 * Session storage utilities for client-side
 */
export class SecureStorage {
  private static readonly PREFIX = 'kagazi_';

  /**
   * Store data securely in localStorage
   */
  static setItem(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      const serialized = JSON.stringify(value);
      const encrypted = btoa(serialized); // Basic encoding (in production, use proper encryption)
      localStorage.setItem(`${this.PREFIX}${key}`, encrypted);
    } catch (error) {
      console.error('SecureStorage.setItem error:', error);
    }
  }

  /**
   * Retrieve data from localStorage
   */
  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const encrypted = localStorage.getItem(`${this.PREFIX}${key}`);
      if (!encrypted) return null;
      
      const serialized = atob(encrypted);
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('SecureStorage.getItem error:', error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${this.PREFIX}${key}`);
    } catch (error) {
      console.error('SecureStorage.removeItem error:', error);
    }
  }

  /**
   * Clear all app-specific data from localStorage
   */
  static clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('SecureStorage.clear error:', error);
    }
  }
}

/**
 * Session cleanup utilities
 */
export class SessionCleanup {
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Start automatic session cleanup
   */
  static startCleanup(): void {
    if (this.cleanupTimer) return;
    
    // Clean up expired data every 30 minutes
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 30 * 60 * 1000);
  }

  /**
   * Stop automatic session cleanup
   */
  static stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Perform cleanup of expired session data
   */
  static performCleanup(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Clean up expired tokens, cached data, etc.
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(SecureStorage['PREFIX'])) {
          try {
            const data = SecureStorage.getItem(key.replace(SecureStorage['PREFIX'], ''));
            if (data && typeof data === 'object' && 'expires' in data) {
              const expires = new Date(data.expires as string);
              if (new Date() >= expires) {
                SecureStorage.removeItem(key.replace(SecureStorage['PREFIX'], ''));
              }
            }
          } catch (error) {
            // Remove corrupted data
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('SessionCleanup.performCleanup error:', error);
    }
  }
}

/**
 * Session refresh utilities
 */
export class SessionRefresh {
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static isRefreshing = false;

  /**
   * Start automatic session refresh monitoring
   */
  static startRefreshMonitoring(): void {
    if (typeof window === 'undefined') return;
    if (this.refreshTimer) return;

    // Check session status every 5 minutes
    this.refreshTimer = setInterval(async () => {
      await this.checkAndRefreshSession();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop automatic session refresh monitoring
   */
  static stopRefreshMonitoring(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check session and refresh if needed
   */
  static async checkAndRefreshSession(): Promise<boolean> {
    if (this.isRefreshing) return false;
    
    try {
      this.isRefreshing = true;
      const validation = await validateClientSession();
      
      if (!validation.isValid && validation.shouldRefresh) {
        // Trigger a session refresh by making a request to NextAuth
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'same-origin',
        });
        
        if (response.ok) {
          // Session refreshed successfully
          return true;
        }
      }
      
      return validation.isValid;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }
}

/**
 * Initialize session management
 */
export function initializeSessionManagement(): void {
  if (typeof window !== 'undefined') {
    // Start cleanup and refresh monitoring
    SessionCleanup.startCleanup();
    SessionRefresh.startRefreshMonitoring();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      SessionCleanup.stopCleanup();
      SessionRefresh.stopRefreshMonitoring();
    });
  }
}

/**
 * Get user permissions based on session
 */
export function getUserPermissions(session: ExtendedSession): {
  canAccessDashboard: boolean;
  canTrade: boolean;
  canViewAnalytics: boolean;
  canModifyProfile: boolean;
} {
  const isVerified = session.user.emailVerified;
  
  return {
    canAccessDashboard: isVerified,
    canTrade: isVerified,
    canViewAnalytics: isVerified,
    canModifyProfile: true, // Always allowed for authenticated users
  };
}
