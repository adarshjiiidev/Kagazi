/**
 * Password Security Utilities
 * Provides password validation, strength checking, and security features
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

// Common weak passwords and patterns to check against
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'password1', 'qwerty123', 'admin123'
];

const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];

/**
 * Get password requirements from environment variables
 */
export function getPasswordRequirements(): PasswordRequirements {
  return {
    minLength: parseInt(process.env.MIN_PASSWORD_LENGTH || '8'),
    requireUppercase: process.env.REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.REQUIRE_NUMBERS === 'true',
    requireSymbols: process.env.REQUIRE_SYMBOLS === 'true',
  };
}

/**
 * Validate password against requirements
 */
export function validatePassword(password: string, requirements?: PasswordRequirements): PasswordValidationResult {
  const reqs = requirements || getPasswordRequirements();
  const feedback: string[] = [];
  let score = 0;

  // Check length
  const lengthValid = password.length >= reqs.minLength;
  if (!lengthValid) {
    feedback.push(`Password must be at least ${reqs.minLength} characters long`);
  } else {
    score += 20;
  }

  // Check uppercase letters
  const uppercaseValid = !reqs.requireUppercase || /[A-Z]/.test(password);
  if (!uppercaseValid) {
    feedback.push('Password must contain at least one uppercase letter');
  } else if (reqs.requireUppercase) {
    score += 15;
  }

  // Check lowercase letters
  const lowercaseValid = !reqs.requireLowercase || /[a-z]/.test(password);
  if (!lowercaseValid) {
    feedback.push('Password must contain at least one lowercase letter');
  } else if (reqs.requireLowercase) {
    score += 15;
  }

  // Check numbers
  const numbersValid = !reqs.requireNumbers || /\d/.test(password);
  if (!numbersValid) {
    feedback.push('Password must contain at least one number');
  } else if (reqs.requireNumbers) {
    score += 15;
  }

  // Check symbols
  const symbolsValid = !reqs.requireSymbols || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!symbolsValid) {
    feedback.push('Password must contain at least one special character');
  } else if (reqs.requireSymbols) {
    score += 15;
  }

  // Additional security checks
  const lowerPassword = password.toLowerCase();
  
  // Check against common passwords
  if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
    feedback.push('Password contains common words or patterns');
    score = Math.max(0, score - 20);
  }

  // Check for keyboard patterns
  if (KEYBOARD_PATTERNS.some(pattern => lowerPassword.includes(pattern))) {
    feedback.push('Avoid keyboard patterns like "qwerty" or "123456"');
    score = Math.max(0, score - 15);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating the same character multiple times');
    score = Math.max(0, score - 10);
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score += 10;
  }
  if (password.length >= 16) {
    score += 10;
  }

  // Bonus for character diversity
  const uniqueChars = new Set(password.toLowerCase()).size;
  if (uniqueChars >= password.length * 0.6) {
    score += 10;
  }

  // Determine strength
  let strength: PasswordValidationResult['strength'];
  if (score >= 85) strength = 'strong';
  else if (score >= 70) strength = 'good';
  else if (score >= 50) strength = 'fair';
  else if (score >= 30) strength = 'weak';
  else strength = 'very-weak';

  // Add positive feedback for strong passwords
  if (strength === 'strong') {
    feedback.unshift('✓ Excellent! Your password is very secure');
  } else if (strength === 'good') {
    feedback.unshift('✓ Good password strength');
  }

  const isValid = lengthValid && uppercaseValid && lowercaseValid && numbersValid && symbolsValid;

  return {
    isValid,
    score: Math.min(100, score),
    strength,
    feedback,
    requirements: {
      length: lengthValid,
      uppercase: uppercaseValid,
      lowercase: lowercaseValid,
      numbers: numbersValid,
      symbols: symbolsValid,
    },
  };
}

/**
 * Generate a strong password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Rate limiting for authentication endpoints
 */
export class AuthRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  /**
   * Check if request should be rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (record.count >= this.maxAttempts) {
      return true;
    }

    // Increment attempt count
    record.count++;
    return false;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - record.count);
  }

  /**
   * Get reset time for rate limit
   */
  getResetTime(identifier: string): number | null {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return null;
    }
    return record.resetTime;
  }

  /**
   * Reset attempts for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clean up expired records
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Singleton instances for different types of rate limiting
export const authRateLimiter = new AuthRateLimiter(
  parseInt(process.env.AUTH_RATE_LIMIT || '5'),
  15 * 60 * 1000 // 15 minutes
);

export const otpRateLimiter = new AuthRateLimiter(
  parseInt(process.env.OTP_RATE_LIMIT || '3'),
  10 * 60 * 1000 // 10 minutes
);

export const resendOtpRateLimiter = new AuthRateLimiter(
  parseInt(process.env.RESEND_OTP_RATE_LIMIT || '1'),
  60 * 1000 // 1 minute
);

/**
 * Get client IP address from request
 */
export function getClientIP(req: any): string {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers?.['x-forwarded-for']?.split(',')[0] ||
    req.headers?.['x-real-ip'] ||
    req.headers?.['x-client-ip'] ||
    '127.0.0.1'
  );
}
