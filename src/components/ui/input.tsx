import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, name, ...props }, ref) => {
    // Disable spellcheck for certain input types
    const shouldDisableSpellcheck = 
      type === 'email' || 
      type === 'password' || 
      name?.includes('username') ||
      name?.includes('email')
    
    return (
      <input
        type={type}
        name={name}
        spellCheck={shouldDisableSpellcheck ? false : undefined}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green/20 focus-visible:border-pact-green",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }