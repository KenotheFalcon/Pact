'use client'

import { useState, useEffect, useCallback } from 'react'

import { z } from 'zod'

import { createClient } from '@/lib/supabase/client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'

import { PushNotificationSetup } from '@/components/PushNotificationSetup'

import { Save, Building2, User, MapPin, Phone, Mail, Landmark, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

const profileSchema = z.object({
    farmName: z.string().min(2, 'Farm name must be at least 2 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
})

const INPUT_WITH_ICON = "h-12 rounded-xl bg-background/50 border-input focus:ring-pact-green focus:border-pact-green pl-11"

function SettingsSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-72 mt-1" />
            </div>
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
        </div>
    )
}

export default function FarmerSettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [email, setEmail] = useState('')
    const [formData, setFormData] = useState({
        farmName: '',
        fullName: '',
        phone: '',
        city: '',
        country: 'Nigeria',
        bio: '',
        bankName: '',
        accountNumber: '',
    })

    const loadProfile = useCallback(async () => {
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setEmail(user.email ?? '')

            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, full_name, phone, city, country, bio')
                .eq('id', user.id)
                .single()

            if (profile) {
                setFormData(prev => ({
                    ...prev,
                    farmName: profile.display_name ?? '',
                    fullName: profile.full_name ?? '',
                    phone: profile.phone ?? '',
                    city: profile.city ?? '',
                    country: profile.country ?? 'Nigeria',
                    bio: profile.bio ?? '',
                }))
            }

            // Load bank account if exists
            const { data: bankAccounts } = await supabase
                .from('farmer_bank_accounts')
                .select('bank_name, account_number')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .limit(1)

            if (bankAccounts && bankAccounts.length > 0) {
                const account = bankAccounts[0]
                setFormData(prev => ({
                    ...prev,
                    bankName: account.bank_name ?? '',
                    accountNumber: account.account_number ?? '',
                }))
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                    display_name: formData.farmName || null,
                    full_name: formData.fullName,
                    phone: formData.phone || null,
                    city: formData.city || null,
                    country: formData.country || null,
                    bio: formData.bio || null,
                })
                .eq('id', user.id)

            if (error) {
                toast.error('Failed to update profile')
                return
            }

            toast.success('Settings saved successfully')
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
                <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your farm profile and account settings.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Section */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-heading text-xl">Farm Profile</CardTitle>
                        <CardDescription>This information will be visible to buyers on your listings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="farmName" className="text-sm font-medium">Farm Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="farmName"
                                        name="farmName"
                                        value={formData.farmName}
                                        onChange={handleChange}
                                        className={INPUT_WITH_ICON}
                                    />
                                </div>
                            </div>
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className="min-h-[120px] rounded-xl bg-background/50 border-input focus:ring-pact-green focus:border-pact-green resize-none"
                                placeholder="Tell buyers about your farm and what makes it special..."
                            />
                            <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Section */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-heading text-xl">Contact Information</CardTitle>
                        <CardDescription>How buyers and the platform can reach you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    </CardContent>
                </Card>

                {/* Payout Section */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-heading text-xl">Payout Details</CardTitle>
                        <CardDescription>Where should we send your earnings? Manage bank accounts in the Payouts page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="bankName" className="text-sm font-medium">Bank Name</Label>
                                <div className="relative">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="bankName"
                                        name="bankName"
                                        value={formData.bankName}
                                        disabled
                                        className={`${INPUT_WITH_ICON} bg-muted cursor-not-allowed`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber" className="text-sm font-medium">Account Number</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="accountNumber"
                                        name="accountNumber"
                                        value={formData.accountNumber ? `****${formData.accountNumber.slice(-4)}` : ''}
                                        disabled
                                        className={`${INPUT_WITH_ICON} bg-muted cursor-not-allowed`}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Bank details are read-only here for security. To update, visit the <a href="/farmer/payouts" className="text-pact-green hover:underline">Payouts</a> page.
                        </p>
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
                    <CardDescription>Manage how you receive updates about your pools and payouts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PushNotificationSetup />
                </CardContent>
            </Card>
        </div>
    )
}
