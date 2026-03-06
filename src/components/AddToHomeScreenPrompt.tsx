'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const A2HS_DISMISSED_KEY = 'pact-a2hs-dismissed'
const A2HS_DISMISSED_EXPIRY_DAYS = 30

/**
 * Add to Home Screen prompt component.
 * Shows a banner prompting users to install the PWA when:
 * 1. The browser supports the beforeinstallprompt event
 * 2. The user hasn't dismissed the prompt in the last 30 days
 * 3. The app isn't already installed
 */
export function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the prompt recently
    const dismissedAt = localStorage.getItem(A2HS_DISMISSED_KEY)
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()
      const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff < A2HS_DISMISSED_EXPIRY_DAYS) {
        return // Don't show if dismissed within the last 30 days
      }
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return // Already installed as PWA
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show our custom prompt after a short delay
      setTimeout(() => setIsVisible(true), 3000)
    }

    const handleAppInstalled = () => {
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    
    try {
      // Show the browser's install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsVisible(false)
      }
    } catch {
      // Silent fail - user may have cancelled
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Remember dismissal for 30 days
    localStorage.setItem(A2HS_DISMISSED_KEY, new Date().toISOString())
  }

  if (!isVisible || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <Card className="border-pact-green/20 bg-card shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pact-green/10">
              <Download className="h-5 w-5 text-pact-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Install Pact</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add to your home screen for quick access and offline features.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="bg-pact-green hover:bg-pact-green/90 text-white h-9"
                >
                  {isInstalling ? 'Installing...' : 'Install'}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                >
                  Not now
                </Button>
              </div>
            </div>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mt-1 -mr-1"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
