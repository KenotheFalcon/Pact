'use client'

import { useState, useEffect } from 'react'
import { MapPin, Navigation, Search, Loader2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LocationData {
  address: string
  latitude?: number
  longitude?: number
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void
  currentLocation?: LocationData
}

export default function LocationPicker({ onLocationSelect, currentLocation }: LocationPickerProps) {
  const [address, setAddress] = useState(currentLocation?.address || '')
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null)
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    if (currentLocation?.address) {
      setAddress(currentLocation.address)
    }
  }, [currentLocation])

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsDetecting(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // In a real app, use a geocoding service here
          const locationData: LocationData = {
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }

          setDetectedLocation(locationData)
          setAddress(locationData.address)
          onLocationSelect(locationData)
        } catch {
          alert('Unable to get address for your location')
        } finally {
          setIsDetecting(false)
        }
      },
      (error) => {
        setIsDetecting(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please enable location services.')
            break
          case error.POSITION_UNAVAILABLE:
            alert('Location information unavailable.')
            break
          case error.TIMEOUT:
            alert('Location request timed out.')
            break
          default:
            alert('An unknown error occurred.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const handleAddressSubmit = () => {
    if (address.trim()) {
      const locationData: LocationData = {
        address: address.trim(),
      }
      onLocationSelect(locationData)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressSubmit()
    }
  }

  return (
    <div className="space-y-4">
      {/* Location Detection Card */}
      {!manualMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-pact-green/50 hover:shadow-lg hover:shadow-pact-green/5 transition-all cursor-pointer"
          onClick={detectCurrentLocation}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-pact-green/10 flex items-center justify-center text-pact-green group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-pact-green transition-colors">Use Current Location</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Automatically detect where you are</p>
            </div>
          </div>
          <Button
            disabled={isDetecting}
            size="sm"
            variant="ghost"
            className="text-pact-green hover:text-emerald-700 hover:bg-pact-green/10 font-medium"
          >
            {isDetecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Detect'
            )}
          </Button>
        </motion.div>
      )}

      {/* Manual Address Entry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {manualMode ? 'Enter Address' : 'Or Enter Address Manually'}
          </Label>
          {!manualMode && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setManualMode(true)}
              className="text-pact-green hover:text-emerald-600 p-0 h-auto font-medium"
            >
              Enter Address
            </Button>
          )}
        </div>

        <AnimatePresence>
          {(manualMode || detectedLocation) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative group"
            >
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 group-focus-within:text-pact-green transition-colors w-5 h-5" />
              <Input
                type="text"
                placeholder="Enter your farm address or location…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 pr-14 h-14 text-base bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-pact-green transition-all focus:scale-[1.01]"
              />
              <Button
                onClick={handleAddressSubmit}
                disabled={!address.trim()}
                size="sm"
                className="absolute right-2 top-2 bottom-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-pact-green dark:hover:bg-pact-green hover:text-white dark:hover:text-white transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Location Preview */}
      <AnimatePresence>
        {address && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl backdrop-blur-sm"
          >
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Selected Location</h4>
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-400 truncate font-medium">{address}</p>
                {detectedLocation?.latitude && detectedLocation?.longitude && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 font-mono bg-emerald-100/50 dark:bg-emerald-900/20 inline-block px-2 py-0.5 rounded-md">
                    {detectedLocation.latitude.toFixed(4)}, {detectedLocation.longitude.toFixed(4)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddress('')
                  setDetectedLocation(null)
                  onLocationSelect({ address: '' })
                }}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 h-8 text-xs font-medium"
              >
                Change
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Tips */}
      <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex gap-3">
        <div className="shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-2" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">Location Tips</h4>
          <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
            Be specific about your farm location. Include nearby landmarks if helpful to make it easy for buyers to find you.
          </p>
        </div>
      </div>
    </div>
  )
}