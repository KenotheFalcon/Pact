'use client';

import { useState } from 'react';
import { checkPasswordStrength, getStrengthColorClass, getStrengthTextColorClass, type PasswordStrengthResult } from '@/lib/password-validation';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PasswordInputWithStrengthProps {
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showStrengthIndicator?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStrengthChange?: (strength: PasswordStrengthResult | null) => void;
}

export function PasswordInputWithStrength({
  id = 'password',
  name = 'password',
  placeholder = '••••••••',
  required = true,
  className = '',
  showStrengthIndicator = true,
  autoComplete = 'new-password',
  value: controlledValue,
  onChange: controlledOnChange,
  onStrengthChange,
}: PasswordInputWithStrengthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null);
  const [touched, setTouched] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlledOnChange) {
      controlledOnChange(e);
    } else {
      setInternalValue(newValue);
    }

    if (newValue.length > 0) {
      const newStrength = checkPasswordStrength(newValue);
      setStrength(newStrength);
      onStrengthChange?.(newStrength);
    } else {
      setStrength(null);
      onStrengthChange?.(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={className}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {showStrengthIndicator && strength && value.length > 0 && (
        <div className="space-y-2">
          {/* Strength bar */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              role="meter"
              aria-label="Password strength"
              aria-valuenow={strength.score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full transition-all duration-300 ${getStrengthColorClass(strength.color)}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <span
              className={`text-sm font-medium capitalize ${getStrengthTextColorClass(strength.color)}`}
              aria-live="polite"
            >
              {strength.label}
            </span>
          </div>

          {/* Issues list - only show if touched and there are issues */}
          {touched && strength.issues.length > 0 && strength.label !== 'strong' && (
            <div className="text-xs space-y-1">
              {strength.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-1.5 text-muted-foreground">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
