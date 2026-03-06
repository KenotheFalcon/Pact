'use client'

import { useState, useEffect, useCallback } from 'react'

import { z } from 'zod'

import { createClient } from '@/lib/supabase/client'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'

import { PushNotificationSetup } from '@/components/PushNotificationSetup'

import { Save, MapPin, User, Phone, Mail, Building, Hash } from 'lucide-react'
import { toast } from 'sonner'

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
})

const INPUT_WITH_ICON = "h-12 rounded-xl bg-background/50 border-input focus:ring-pact-green focus:border-pact-green pl-11"

function SettingsSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-80 mt-1" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    )
}

export default function BuyerSettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [email, setEmail] = useState('')
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        zipCode: '',
    })

    const loadProfile = useCallback(async () => {
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setEmail(user.email ?? '')

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone, address, city, country')
                .eq('id', user.id)
                .single()

            if (profile) {
                setFormData({
                    fullName: profile.full_name ?? '',
                    phone: profile.phone ?? '',
                    address: profile.address ?? '',
                    city: profile.city ?? '',
                    country: profile.country ?? 'Nigeria',
                    zipCode: '',
                })
            }
        } catch {
            toast.error('Failed to load profile')
        } finally {
            setIsFetching(false)
        }
    }, [])

    useEffect(() => {
        loadProfile()
    }, [loadProfile])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const result = profileSchema.safeParse(formData)
        if (!result.success) {
            toast.error(result.error.errors[0].message)
            return
        }

        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('You must be logged in')
                return
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    city: formData.city || null,
                    country: formData.country || null,
                })
                .eq('id', user.id)

            if (error) {
                toast.error('Failed to update profile')
                return
            }

            toast.success('Profile updated successfully')
        } catch {
            toast.error('Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return <SettingsSkeleton />
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your personal information and shipping details.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-heading text-xl">Personal Information</CardTitle>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={INPUT_WITH_ICON}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={INPUT_WITH_ICON}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    disabled
                                    className={`${INPUT_WITH_ICON} bg-muted cursor-not-allowed`}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-heading text-xl">Shipping Address</CardTitle>
                        <CardDescription>Where should we deliver your orders?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={INPUT_WITH_ICON}
                                    placeholder="Enter your street address"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className={INPUT_WITH_ICON}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className={INPUT_WITH_ICON}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-sm font-medium">Zip Code</Label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="zipCode"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        className={INPUT_WITH_ICON}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <LoadingButton
                        type="submit"
                        loading={isLoading}
                        loadingText="Saving..."
                        icon={Save}
                        className="min-w-[140px] h-12 rounded-xl bg-pact-green hover:bg-pact-green/90"
                    >
                        Save Changes
                    </LoadingButton>
                </div>
            </form>

            {/* Push Notifications */}
            <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="font-heading text-xl">Notifications</CardTitle>
                    <CardDescription>Manage how you receive updates about your orders and pools.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PushNotificationSetup />
                </CardContent>
            </Card>
        </div>
    )
}
