'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

/**
 * Theme Provider - Manages dark/light mode across the application
 * Prevents flash of unstyled content (FOUC) and handles system theme detection
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="pact-theme"
            {...props}
        >
            {children}
        </NextThemesProvider>
    )
}
