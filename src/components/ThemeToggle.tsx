'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Theme Toggle Button - Switches between light and dark modes
 * Uses client-side hydration to prevent theme mismatch
 */
export function ThemeToggle({ className }: { className?: string }) {
    const [mounted, setMounted] = React.useState(false)
    const { theme, setTheme } = useTheme()

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Prevent hydration mismatch by rendering placeholder during SSR
    if (!mounted) {
        return (
            <div 
                className={`inline-flex h-9 w-9 items-center justify-center ${className || ''}`}
                aria-hidden="true"
            />
        )
    }

    const isDark = theme === 'dark'

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 ${className || ''}`}
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    >
                        {isDark ? (
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
                        ) : (
                            <Moon className="h-4 w-4 rotate-0 scale-100 transition-all" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {`Switch to ${isDark ? 'light' : 'dark'} mode`}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
