'use client'

import { Eye, EyeOff } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const inputId = React.useId()
        const buttonId = `${inputId}-toggle`

        return (
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    className={cn("hide-password-toggle pr-10", className)}
                    ref={ref}
                    aria-describedby={buttonId}
                    {...props}
                />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                id={buttonId}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                )}
                                <span className="sr-only">
                                    {showPassword ? "Hide password" : "Show password"}
                                </span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{showPassword ? "Hide password" : "Show password"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        )
    }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
