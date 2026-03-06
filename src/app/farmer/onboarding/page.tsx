'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, MapPin, Phone, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface FormData {
  farmName: string
  location: string
  phone: string
  bio: string
}

export default function FarmerOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    farmName: '',
    location: '',
    phone: '',
    bio: ''
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

      // Update the profile with farmer details
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.farmName,
          bio: formData.bio,
          phone: formData.phone,
          location: formData.location,
          role: 'farmer',
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', user.id)

      if (error) {
        toast.error('Failed to save profile. Please try again.')
        return
      }

      // Also create/update the farmers table entry
      const { error: farmerError } = await supabase
        .from('farmers')
        .upsert({
          user_id: user.id,
          farm_name: formData.farmName,
          location: formData.location,
          phone: formData.phone,
          bio: formData.bio,
          is_verified: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (farmerError) {
        // Non-critical, profile was saved
      }

      toast.success('Welcome to Pact! Your farm profile is ready.')
      router.push('/farmer')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const isStep1Valid = formData.farmName.trim().length >= 2 && formData.location.trim().length >= 2
  const isStep2Valid = formData.phone.trim().length >= 10

  return (
    <div className="min-h-screen bg-gradient-to-b from-pact-green/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-pact-green/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-pact-green" />
          </div>
          <CardTitle className="text-2xl">Complete Your Farm Profile</CardTitle>
          <CardDescription>
            Tell us about your farm to start selling on Pact
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { num: 1, label: 'Farm Info' },
              { num: 2, label: 'Contact' },
              { num: 3, label: 'Review' }
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="farmName"
                      placeholder="e.g., Green Valley Farms"
                      value={formData.farmName}
                      onChange={(e) => handleInputChange('farmName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Farm Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., Oyo State, Nigeria"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., 08012345678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We will use this to contact you about orders
                  </p>
                </div>

                <div className="flex gap-3">
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
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">About Your Farm (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell buyers about your farm, what you grow, and your farming practices…"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Profile Summary</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Farm:</strong> {formData.farmName}</p>
                    <p><strong>Location:</strong> {formData.location}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                  </div>
                </div>

                <div className="flex gap-3">
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
                    Complete Setup
                  </LoadingButton>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
