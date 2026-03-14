'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Save, Upload, DollarSign, Package, Calendar, CheckCircle2, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { createListingAction } from '@/app/farmer/listings/create/actions'
import ImageUpload from '@/components/farmer/ImageUpload'
import LocationPicker from '@/components/farmer/LocationPicker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ListingFormData } from '@/types/farmer'


const CATEGORIES = [
  'Fruits', 'Vegetables', 'Grains', 'Dairy', 'Meat', 'Poultry', 'Seafood',
  'Herbs', 'Nuts', 'Seeds', 'Oils', 'Honey', 'Eggs', 'Other'
]

const UNITS = [
  'kg', 'lbs', 'pieces', 'dozen', 'box', 'crate', 'bag', 'bunch', 'bundle'
]

export default function CreateListingForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<ListingFormData>({
    name: '',
    description: '',
    category: '',
    pricePerUnit: 0,
    unit: 'kg',
    quantity: 0,
    minQuantity: 1,
    images: [],
    location: {
      address: '',
      latitude: undefined,
      longitude: undefined
    },
    harvestDate: '',
    expiryDate: '',
    organic: false,
    negotiable: false
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        return !!(formData.name && formData.description && formData.category)
      case 2: // Pricing & Inventory
        return !!(formData.pricePerUnit > 0 && formData.quantity > 0 && formData.minQuantity > 0)
      case 3: // Images & Location
        return !!(uploadedImages.length > 0 && formData.location.address)
      case 4: // Dates & Details
        return !!(formData.harvestDate && formData.expiryDate)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      setError(null)
    } else {
      setError('Please fill in all required fields')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleImageUpload = (urls: string[]) => {
    setUploadedImages(urls)
  }

  const handleLocationSelect = (location: { address: string; latitude?: number; longitude?: number }) => {
    setFormData(prev => ({ ...prev, location }))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Call Server Action with form data
      const result = await createListingAction({
        ...formData,
        images: uploadedImages,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create listing')
        toast.error(result.error || 'Failed to create listing')
        return
      }

      setSuccess(true)
      toast.success('Listing created successfully!')
      
      setTimeout(() => {
        router.push('/farmer/listings')
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create listing'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', icon: Package, description: 'Product details' },
    { number: 2, title: 'Pricing', icon: DollarSign, description: 'Cost & quantity' },
    { number: 3, title: 'Media', icon: Upload, description: 'Photos & location' },
    { number: 4, title: 'Details', icon: Calendar, description: 'Dates & review' }
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/farmer/listings')}
            className="mb-2 pl-0 hover:pl-2 transition-all text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Listings
          </Button>
          <h1 className="font-heading text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Create New Listing</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Add your fresh produce to the marketplace</p>
        </div>

        {/* Progress Indicator (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                currentStep === step.number ? "bg-pact-green text-white" :
                  currentStep > step.number ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
              )}>
                <span>{step.number}</span>
                <span className={cn("hidden lg:inline", currentStep !== step.number && "hidden")}>{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Progress (Desktop - Detailed) */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 space-y-4">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <div
                  key={step.number}
                  className={cn(
                    "relative flex items-start p-4 rounded-2xl transition-all duration-300 border",
                    isActive
                      ? "bg-white dark:bg-zinc-900 border-pact-green/30 shadow-lg shadow-pact-green/5"
                      : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeStep"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-pact-green rounded-l-2xl"
                    />
                  )}

                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-colors",
                    isActive ? "bg-pact-green text-white shadow-md shadow-pact-green/20" :
                      isCompleted ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>

                  <div>
                    <span className={cn(
                      "block font-bold text-base mb-0.5 transition-colors",
                      isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                    )}>
                      {step.title}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      {step.description}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Progress */}
        <div className="lg:hidden mb-6">
          <div className="flex justify-between px-2 relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-100 dark:bg-zinc-800 -z-10 -translate-y-1/2" />

            {steps.map((step) => (
              <div
                key={step.number}
                className={cn(
                  "flex flex-col items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-2",
                  currentStep === step.number ? "text-pact-green" : currentStep > step.number ? "text-emerald-600" : "text-zinc-400"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  currentStep === step.number ? "border-pact-green bg-pact-green text-white scale-110 shadow-md shadow-pact-green/20" :
                    currentStep > step.number ? "border-emerald-600 bg-emerald-600 text-white" :
                      "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                )}>
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert 
                  variant="destructive" 
                  className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                  id="listing-form-error"
                  role="alert"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <AlertDescription>
                    Listing created successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-pact-green/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="p-6 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{steps[currentStep - 1].title}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                      {currentStep === 1 && "Tell us about your produce"}
                      {currentStep === 2 && "Set pricing and inventory details"}
                      {currentStep === 3 && "Add images and location information"}
                      {currentStep === 4 && "Set harvest dates and additional details"}
                    </p>
                  </div>

                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Fresh Tomatoes"
                          className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-pact-green transition-all focus:scale-[1.01]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-base">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-base">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your produce, growing methods, quality, etc."
                          rows={5}
                          className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-pact-green resize-none transition-all focus:scale-[1.01]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Pricing & Inventory */}
                  {currentStep === 2 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="pricePerUnit" className="text-base">Price per Unit *</Label>
                          <div className="relative group">
                            <span className="absolute left-4 top-4 text-zinc-400 group-focus-within:text-pact-green transition-colors">₦</span>
                            <Input
                              id="pricePerUnit"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.pricePerUnit || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                              className="pl-10 h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit" className="text-base">Unit *</Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                          >
                            <SelectTrigger className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]">
                              <SelectValue placeholder="Select unit..." />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(unit => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="quantity" className="text-base">Total Quantity *</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                            className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minQuantity" className="text-base">Minimum Order Quantity *</Label>
                          <Input
                            id="minQuantity"
                            type="number"
                            min="1"
                            value={formData.minQuantity || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 1 }))}
                            placeholder="1"
                            className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.organic}
                              onChange={(e) => setFormData(prev => ({ ...prev, organic: e.target.checked }))}
                              className="peer sr-only"
                            />
                            <div className="w-6 h-6 border-2 border-zinc-300 rounded-md peer-checked:bg-pact-green peer-checked:border-pact-green transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-pact-green peer-focus-visible:ring-offset-2"></div>
                            <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" />
                          </div>
                          <span className="text-base font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Organic Produce</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.negotiable}
                              onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                              className="peer sr-only"
                            />
                            <div className="w-6 h-6 border-2 border-zinc-300 rounded-md peer-checked:bg-pact-green peer-checked:border-pact-green transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-pact-green peer-focus-visible:ring-offset-2"></div>
                            <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" />
                          </div>
                          <span className="text-base font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Price Negotiable</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Images & Location */}
                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <Label className="text-base">Product Images *</Label>
                        <ImageUpload
                          onImagesUpload={handleImageUpload}
                          maxImages={5}
                          currentImages={uploadedImages}
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base">Location *</Label>
                        <LocationPicker
                          onLocationSelect={handleLocationSelect}
                          currentLocation={formData.location}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Dates & Details */}
                  {currentStep === 4 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="harvestDate" className="text-base">Harvest Date *</Label>
                          <Input
                            id="harvestDate"
                            type="date"
                            value={formData.harvestDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expiryDate" className="text-base">Expiry Date *</Label>
                          <Input
                            id="expiryDate"
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 transition-all focus:scale-[1.01]"
                          />
                        </div>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Listing Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400 block mb-1 text-xs uppercase tracking-wide">Product</span>
                            <span className="font-bold text-lg text-zinc-900 dark:text-white">{formData.name}</span>
                          </div>
                          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400 block mb-1 text-xs uppercase tracking-wide">Category</span>
                            <span className="font-bold text-lg text-zinc-900 dark:text-white">{formData.category}</span>
                          </div>
                          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400 block mb-1 text-xs uppercase tracking-wide">Price</span>
                            <span className="font-bold text-lg text-zinc-900 dark:text-white">₦{formData.pricePerUnit}/{formData.unit}</span>
                          </div>
                          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400 block mb-1 text-xs uppercase tracking-wide">Quantity</span>
                            <span className="font-bold text-lg text-zinc-900 dark:text-white">{formData.quantity} {formData.unit}</span>
                          </div>
                          <div className="col-span-1 md:col-span-2 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400 block mb-1 text-xs uppercase tracking-wide">Location</span>
                            <span className="font-bold text-lg text-zinc-900 dark:text-white truncate block">{formData.location.address}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                          {formData.organic && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1">Organic</Badge>}
                          {formData.negotiable && <Badge variant="outline" className="text-zinc-600 border-zinc-300 px-3 py-1">Negotiable</Badge>}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-6 md:p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center backdrop-blur-sm">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-pact-green hover:bg-emerald-600 text-white shadow-lg shadow-pact-green/20 hover:shadow-pact-green/30 transition-all hover:-translate-y-0.5"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-pact-green hover:bg-emerald-600 text-white shadow-lg shadow-pact-green/20 hover:shadow-pact-green/30 transition-all hover:-translate-y-0.5 min-w-[160px]"
                >
                  {loading ? (
                    'Creating...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Listing
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}