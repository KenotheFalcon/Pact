/**
 * Password validation and strength checking utilities
 * Implements client-side checks for common weak password patterns
 */

import {
  MIN_PASSWORD_LENGTH,
  RECOMMENDED_PASSWORD_LENGTH,
  STRONG_PASSWORD_LENGTH,
  PASSWORD_STRENGTH_THRESHOLDS,
} from '@/lib/constants'

const COMMON_WEAK_PATTERNS = [
  /^password/i,
  /^123456/,
  /^qwerty/i,
  /^letmein/i,
  /^welcome/i,
  /^monkey/i,
  /^dragon/i,
  /^master/i,
  /^sunshine/i,
  /^iloveyou/i,
  /^admin/i,
  /^login/i,
  /^changeme/i,
  /^trustno1/i,
];

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number; // 0-100
  label: PasswordStrength;
  issues: string[];
  color: 'red' | 'orange' | 'yellow' | 'green';
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const issues: string[] = [];
  let score = 0;

  // Length scoring
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  } else if (password.length >= MIN_PASSWORD_LENGTH && password.length < RECOMMENDED_PASSWORD_LENGTH) {
    score += 20;
    issues.push(`Consider using at least ${RECOMMENDED_PASSWORD_LENGTH} characters for better security`);
  } else if (password.length >= RECOMMENDED_PASSWORD_LENGTH) {
    score += 30;
  }
  
  if (password.length >= STRONG_PASSWORD_LENGTH) {
    score += 10;
  }

  // Character diversity
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasLowercase) {
    score += 15;
  } else {
    issues.push('Add lowercase letters (a-z)');
  }

  if (hasUppercase) {
    score += 15;
  } else {
    issues.push('Add uppercase letters (A-Z)');
  }

  if (hasDigit) {
    score += 15;
  } else {
    issues.push('Add numbers (0-9)');
  }

  if (hasSymbol) {
    score += 15;
  } else {
    issues.push('Add symbols (!@#$%^&*...)');
  }

  // Check for common weak patterns
  const hasWeakPattern = COMMON_WEAK_PATTERNS.some(pattern => 
    pattern.test(password)
  );
  if (hasWeakPattern) {
    issues.push('Avoid common password patterns');
    score -= 30;
  }

  // Check for repeated characters (e.g., "aaaaaa")
  if (/(.)\1{3,}/.test(password)) {
    issues.push('Avoid repeating characters');
    score -= 20;
  }

  // Sequential characters (e.g., "123456", "abcdef")
  if (/(?:012|123|234|345|456|567|678|789|abc|bcd|cde|def)/i.test(password)) {
    issues.push('Avoid sequential characters');
    score -= 20;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine label and color
  let label: PasswordStrength;
  let color: 'red' | 'orange' | 'yellow' | 'green';
  
  if (score < PASSWORD_STRENGTH_THRESHOLDS.WEAK) {
    label = 'weak';
    color = 'red';
  } else if (score < PASSWORD_STRENGTH_THRESHOLDS.FAIR) {
    label = 'fair';
    color = 'orange';
  } else if (score < PASSWORD_STRENGTH_THRESHOLDS.GOOD) {
    label = 'good';
    color = 'yellow';
  } else {
    label = 'strong';
    color = 'green';
  }

  return { score, label, issues, color };
}

/**
 * Get color classes for Tailwind based on strength color
 */
export function getStrengthColorClass(color: 'red' | 'orange' | 'yellow' | 'green'): string {
  switch (color) {
    case 'red':
      return 'bg-red-500';
    case 'orange':
      return 'bg-orange-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'green':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Get text color classes for labels
 */
export function getStrengthTextColorClass(color: 'red' | 'orange' | 'yellow' | 'green'): string {
  switch (color) {
    case 'red':
      return 'text-red-600 dark:text-red-400';
    case 'orange':
      return 'text-orange-600 dark:text-orange-400';
    case 'yellow':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'green':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}
