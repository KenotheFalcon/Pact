'use client';

import { AlertCircle, Shield } from 'lucide-react';

interface SecurityNoticeProps {
  variant?: 'info' | 'warning';
  className?: string;
}

export function SecurityNotice({ variant = 'info', className = '' }: SecurityNoticeProps) {
  if (variant === 'warning') {
    return (
      <div className={`bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 ${className}`}>
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-amber-900 dark:text-amber-200 font-medium mb-1">
              Security Notice
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              Create a unique password you haven&apos;t used elsewhere. Avoid common words or patterns that are easier to guess.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 ${className}`}>
      <div className="flex gap-3">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">
            Create a Strong Password
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>At least 12 characters long</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Mix of uppercase, lowercase, numbers, and symbols</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Use a password manager (1Password, Bitwarden, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Never reuse passwords from other sites</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
