'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordValidationResult {
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

interface PasswordStrengthProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
}

// Client-side password validation (simplified version of server-side)
function validatePasswordClient(password: string): PasswordValidationResult {
  const feedback: string[] = [];
  let score = 0;
  const minLength = 8; // Default minimum length

  // Check length
  const lengthValid = password.length >= minLength;
  if (!lengthValid) {
    feedback.push(`Password must be at least ${minLength} characters long`);
  } else {
    score += 20;
  }

  // Check uppercase letters
  const uppercaseValid = /[A-Z]/.test(password);
  if (!uppercaseValid) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 15;
  }

  // Check lowercase letters
  const lowercaseValid = /[a-z]/.test(password);
  if (!lowercaseValid) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 15;
  }

  // Check numbers
  const numbersValid = /\d/.test(password);
  if (!numbersValid) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 15;
  }

  // Check symbols
  const symbolsValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (symbolsValid) {
    score += 15;
  }

  // Additional security checks
  const lowerPassword = password.toLowerCase();
  
  // Check against common passwords
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123'];
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    feedback.push('Password contains common words or patterns');
    score = Math.max(0, score - 20);
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

  const isValid = lengthValid && uppercaseValid && lowercaseValid && numbersValid;

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

export function PasswordStrength({ password, className, showRequirements = true }: PasswordStrengthProps) {
  const validation = validatePasswordClient(password);

  if (!password) {
    return null;
  }

  const getStrengthColor = (strength: string, score: number) => {
    switch (strength) {
      case 'very-weak':
        return 'bg-red-500';
      case 'weak':
        return 'bg-orange-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'very-weak':
        return 'Very Weak';
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
      default:
        return 'Unknown';
    }
  };

  const getStrengthTextColor = (strength: string) => {
    switch (strength) {
      case 'very-weak':
        return 'text-red-500';
      case 'weak':
        return 'text-orange-500';
      case 'fair':
        return 'text-yellow-500';
      case 'good':
        return 'text-blue-500';
      case 'strong':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">Password Strength</span>
          <span className={cn('font-medium', getStrengthTextColor(validation.strength))}>
            {getStrengthText(validation.strength)}
          </span>
        </div>
        <Progress 
          value={validation.score} 
          className="h-2 bg-white/10"
        />
        <div 
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            getStrengthColor(validation.strength, validation.score)
          )}
          style={{ width: `${validation.score}%` }}
        />
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <div className="text-sm text-white/80 font-medium">Requirements:</div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <RequirementItem 
              met={validation.requirements.length} 
              text="At least 8 characters" 
            />
            <RequirementItem 
              met={validation.requirements.uppercase} 
              text="One uppercase letter (A-Z)" 
            />
            <RequirementItem 
              met={validation.requirements.lowercase} 
              text="One lowercase letter (a-z)" 
            />
            <RequirementItem 
              met={validation.requirements.numbers} 
              text="One number (0-9)" 
            />
            <RequirementItem 
              met={validation.requirements.symbols} 
              text="One special character (!@#$%^&*)" 
              optional 
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {validation.feedback.length > 0 && (
        <div className="space-y-1">
          {validation.feedback.map((message, index) => (
            <div 
              key={index}
              className={cn(
                'flex items-start gap-2 text-xs',
                message.startsWith('✓') ? 'text-green-400' : 'text-yellow-400'
              )}
            >
              {message.startsWith('✓') ? (
                <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              )}
              <span className="leading-tight">{message.replace('✓ ', '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
  optional?: boolean;
}

function RequirementItem({ met, text, optional = false }: RequirementItemProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 transition-colors duration-200',
      met ? 'text-green-400' : optional ? 'text-white/60' : 'text-white/40'
    )}>
      {met ? (
        <Check className="h-3 w-3 flex-shrink-0" />
      ) : (
        <X className={cn(
          'h-3 w-3 flex-shrink-0',
          optional ? 'text-white/40' : 'text-red-400'
        )} />
      )}
      <span className={cn(
        'text-xs leading-tight',
        optional && !met && 'text-white/50'
      )}>
        {text} {optional && <span className="text-white/40">(optional)</span>}
      </span>
    </div>
  );
}
