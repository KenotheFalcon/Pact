'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Plus, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { uploadImages, compressImage, validateImageFile } from '@/lib/utils/image-upload'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImagesUpload: (urls: string[]) => void
  maxImages?: number
  currentImages?: string[]
  autoUpload?: boolean
}

export default function ImageUpload({
  onImagesUpload,
  maxImages = 5,
  currentImages = [],
  autoUpload = true
}: ImageUploadProps) {
  const [previewImages, setPreviewImages] = useState<string[]>(currentImages)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(currentImages)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      processFiles(files)
    }
  }

  const processFiles = async (files: File[]) => {
    setErrors([])

    // Filter and validate image files
    const validFiles: File[] = []
    const newErrors: string[] = []

    for (const file of files) {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        newErrors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (validFiles.length === 0) {
      setErrors(newErrors.length > 0 ? newErrors : ['No valid image files selected'])
      return
    }

    // Check total images limit
    const totalImages = previewImages.length + validFiles.length
    if (totalImages > maxImages) {
      setErrors([`You can only upload up to ${maxImages} images total`])
      return
    }

    try {
      // Create preview URLs immediately
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
      setPreviewImages(prev => [...prev, ...newPreviewUrls])

      if (autoUpload) {
        setUploading(true)
        setUploadProgress(0)

        // Compress images before upload
        const compressedFiles = await Promise.all(
          validFiles.map(file => compressImage(file, 1920, 1920, 0.85))
        )

        // Upload to Supabase Storage
        const { urls, errors: uploadErrors } = await uploadImages(
          compressedFiles,
          'listings',
          (uploaded, total) => {
            setUploadProgress((uploaded / total) * 100)
          }
        )

        if (uploadErrors.length > 0) {
          setErrors(curr => [...curr, ...uploadErrors])
        }

        // Update state with uploaded URLs
        const newUrls = [...uploadedUrls, ...urls]
        setUploadedUrls(newUrls)
        onImagesUpload(newUrls)

        // Replace preview URLs with actual uploaded URLs
        const updatedPreviews = [...previewImages.slice(0, -validFiles.length), ...urls]
        setPreviewImages(updatedPreviews)

        setUploading(false)
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'
      setErrors(curr => [...curr, errorMessage])
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    // Clean up preview URL if it's a blob
    if (previewImages[index] && previewImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewImages[index])
    }

    const newPreviewImages = previewImages.filter((_, i) => i !== index)
    const newUrls = uploadedUrls.filter((_, i) => i !== index)

    setPreviewImages(newPreviewImages)
    setUploadedUrls(newUrls)
    onImagesUpload(newUrls)
  }

  const triggerFileInput = () => {
    if (!uploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden",
          isDragging
            ? "border-pact-green bg-pact-green/5 scale-[1.02]"
            : uploading
              ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed"
              : "border-zinc-300 dark:border-zinc-700 hover:border-pact-green/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center">
          {uploading ? (
            <div className="mb-4 relative">
              <div className="absolute inset-0 bg-pact-green/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-12 h-12 text-pact-green animate-spin relative z-10" />
            </div>
          ) : (
            <div className={cn(
              "mb-4 p-4 rounded-full transition-colors duration-300",
              isDragging ? "bg-pact-green/10 text-pact-green" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-pact-green"
            )}>
              <Upload className="w-8 h-8" />
            </div>
          )}

          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
            {uploading ? 'Uploading Images...' : 'Upload Product Images'}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
            {uploading
              ? `Processing your photos... ${Math.round(uploadProgress)}%`
              : 'Drag and drop your high-quality photos here, or click to browse'}
          </p>

          <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium uppercase tracking-wider">
            <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> JPG, PNG, WEBP</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>Max 10MB</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>Up to {maxImages} images</span>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
            <motion.div
              className="h-full bg-pact-green"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}
      </motion.div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Grid */}
      <AnimatePresence>
        {previewImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                Uploaded Images <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{previewImages.length} / {maxImages}</Badge>
              </h4>
              {previewImages.length < maxImages && !uploading && (
                <button
                  onClick={triggerFileInput}
                  className="text-sm text-pact-green hover:text-emerald-600 font-medium flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add more
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {previewImages.map((imageUrl, index) => (
                <motion.div
                  key={imageUrl}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                  className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                >
                  <Image
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  <button
                    onClick={() => removeImage(index)}
                    disabled={uploading}
                    className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-sm backdrop-blur-sm"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge className="w-full justify-center bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-white backdrop-blur-sm shadow-sm border-0 text-[10px] font-bold uppercase tracking-wider">
                        Cover Image
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Add More Button (Grid Item) */}
              {previewImages.length < maxImages && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={triggerFileInput}
                  className="aspect-square border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center hover:border-pact-green/50 hover:bg-pact-green/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-zinc-400 group-hover:text-pact-green" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-pact-green">Add Image</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Tips */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ImageIcon className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Pro Tip: Quality Matters</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
            Listings with clear, well-lit photos sell 3x faster. Use natural light and show your produce from multiple angles to build trust with buyers.
          </p>
        </div>
      </div>
    </div>
  )
}