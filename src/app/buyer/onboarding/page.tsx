'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FormField } from '@/components/ui/form-field'
import { SuccessCheckBadge } from '@/components/ui/success-check'
import { CheckCircle2, MapPin, Bell, ShoppingBag, Phone, Salad, Apple, Wheat, Egg, Milk, CircleDot } from 'lucide-react'
import { toast } from 'sonner'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Validation schemas
const addressSchema = z.string().min(2, 'Address must be at least 2 characters')
const citySchema = z.string().min(2, 'City must be at least 2 characters')
const phoneSchema = z.string().regex(/^0[789]\d{9}$/, 'Enter a valid Nigerian phone number').optional().or(z.literal(''))

interface FormData {
  address: string
  city: string
  phone: string
  // Note: preferredCategories and notification preferences are stored in localStorage
  // until database schema is extended to support them
  preferredCategories: string[]
  notifyNewPools: boolean
  notifyPriceDrops: boolean
  notifyOrderUpdates: boolean
}

const PRODUCE_CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables', Icon: Salad },
  { id: 'fruits', label: 'Fruits', Icon: Apple },
  { id: 'grains', label: 'Grains & Cereals', Icon: Wheat },
  { id: 'tubers', label: 'Tubers', Icon: CircleDot },
  { id: 'proteins', label: 'Proteins', Icon: Egg },
  { id: 'dairy', label: 'Dairy', Icon: Milk },
]

export default function BuyerOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const prefersReducedMotion = useReducedMotion()
  
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    address: '',
    city: '',
    phone: '',
    preferredCategories: [],
    notifyNewPools: true,
    notifyPriceDrops: true,
    notifyOrderUpdates: true
  })

  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(categoryId)
        ? prev.preferredCategories.filter(id => id !== categoryId)
        : [...prev.preferredCategories, categoryId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to continue')
        router.push('/login')
        return
      }

      // Update the profile with buyer preferences
      // Store preferences locally until database schema supports them
      if (typeof window !== 'undefined') {
        localStorage.setItem('buyer_preferences', JSON.stringify({
          preferredCategories: formData.preferredCategories,
          notifyNewPools: formData.notifyNewPools,
          notifyPriceDrops: formData.notifyPriceDrops,
          notifyOrderUpdates: formData.notifyOrderUpdates
        }))
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          address: formData.address,
          city: formData.city,
          phone: formData.phone || null,
          role: 'buyer',
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', user.id)

      if (error) {
        toast.error('Failed to save preferences. Please try again.')
        return
      }

      // Show success animation
      setShowSuccess(true)
      
      // Wait for animation then redirect
      setTimeout(() => {
        toast.success('Welcome to Pact! Start exploring pools.')
        router.push('/buyer')
      }, 1500)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const isStep1Valid = formData.address.trim().length >= 2 && formData.city.trim().length >= 2
  const isStep2Valid = formData.preferredCategories.length > 0

  // Animation variants
  const stepVariants = {
    initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pact-green/5 to-background flex items-center justify-center p-4">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SuccessCheckBadge size={80} className="mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">All Set!</h2>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pact-green/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-pact-green/10 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-pact-green" />
          </div>
          <CardTitle className="text-2xl">Welcome to Pact</CardTitle>
          <CardDescription>
            Let us personalize your experience
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { num: 1, label: 'Location' },
              { num: 2, label: 'Preferences' },
              { num: 3, label: 'Notifications' }
            ].map((s, index) => (
              <div
                key={s.num}
                className={`flex flex-col items-center ${index < 2 ? 'flex-1' : ''}`}
              >
                <div className="flex items-center w-full">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s.num
                        ? 'bg-pact-green text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    aria-current={step === s.num ? 'step' : undefined}
                  >
                    {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded ${
                        step > s.num ? 'bg-pact-green' : 'bg-muted'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 ${
                    step >= s.num ? 'text-pact-green font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Location */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <FormField
                    label="City"
                    name="city"
                    placeholder="e.g., Lagos"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    schema={citySchema}
                    icon={<MapPin className="h-4 w-4" />}
                    helperText="Your city helps us show pools near you"
                    required
                  />

                  <FormField
                    label="Address"
                    name="address"
                    placeholder="e.g., 123 Main Street, Ikeja"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    schema={addressSchema}
                    helperText="Your delivery address"
                    required
                  />

                  <FormField
                    label="Phone Number (Optional)"
                    name="phone"
                    type="tel"
                    placeholder="e.g., 08012345678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    icon={<Phone className="h-4 w-4" />}
                    helperText="For order updates and delivery coordination"
                  />

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="w-full mt-4"
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Preferences */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>What produce interests you?</Label>
                    <p className="text-sm text-muted-foreground">
                      Select one or more categories
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCE_CATEGORIES.map((category) => {
                      const isSelected = formData.preferredCategories.includes(category.id)
                      const IconComponent = category.Icon
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-pact-green bg-pact-green/10'
                              : 'border-muted hover:border-muted-foreground/30'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <IconComponent 
                            className={`w-5 h-5 ${isSelected ? 'text-pact-green' : 'text-muted-foreground'}`} 
                            aria-hidden="true" 
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-pact-green' : ''}`}>
                            {category.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-pact-green ml-auto" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!isStep2Valid}
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Notifications */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-pact-green" />
                      <Label className="text-base">Notification Preferences</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose what updates you would like to receive
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-pools" className="text-sm font-medium">
                          New Pools Near You
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when new pools open in your area
                        </p>
                      </div>
                      <Switch
                        id="notify-pools"
                        checked={formData.notifyNewPools}
                        onCheckedChange={(checked) => handleInputChange('notifyNewPools', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-prices" className="text-sm font-medium">
                          Price Drops
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Alerts when prices drop on items you want
                        </p>
                      </div>
                      <Switch
                        id="notify-prices"
                        checked={formData.notifyPriceDrops}
                        onCheckedChange={(checked) => handleInputChange('notifyPriceDrops', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-orders" className="text-sm font-medium">
                          Order Updates
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Status changes for your pool orders
                        </p>
                      </div>
                      <Switch
                        id="notify-orders"
                        checked={formData.notifyOrderUpdates}
                        onCheckedChange={(checked) => handleInputChange('notifyOrderUpdates', checked)}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Your Preferences</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Location:</strong> {formData.city}{formData.address ? `, ${formData.address}` : ''}</p>
                      <p><strong>Interests:</strong> {formData.preferredCategories.map(id => 
                        PRODUCE_CATEGORIES.find(c => c.id === id)?.label
                      ).join(', ') || 'None selected'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <LoadingButton
                      type="submit"
                      loading={isLoading}
                      loadingText="Saving…"
                      className="flex-1"
                    >
                      Get Started
                    </LoadingButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
