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
          "flex h-12 w-full rounded-2xl border border-input/50 bg-background px-5 py-3 text-sm ring-offset-background shadow-subtle",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green/30 focus-visible:border-pact-green focus-visible:shadow-glow",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-300 hover:shadow-card hover:border-input",
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