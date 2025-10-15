'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Upload, ChevronLeft, Camera, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UploadStep = 'select' | 'uploading' | 'processing' | 'review' | 'saving' | 'success'

interface ExtractedMeasurement {
  metric: string
  value: number
  unit: string
  confidence?: number
  raw_text?: string
}

export default function UploadMeasurementPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<UploadStep>('select')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedMeasurement[]>([])
  const [measurementDate, setMeasurementDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  )
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setStep('uploading')
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Upload to Supabase Storage
      // Sanitize filename - remove special characters that Supabase doesn't allow
      const sanitizedName = selectedFile.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      
      const fileName = `${user.id}/${Date.now()}-${sanitizedName}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('measurement-images')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('measurement-images')
        .getPublicUrl(fileName)

      setImageUrl(publicUrl)

      // Extract measurements using OpenAI
      setStep('processing')
      await extractMeasurements(publicUrl)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
      setStep('select')
    }
  }

  const extractMeasurements = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/measurements/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error from API
        console.error('API Error Response:', data)
        throw new Error(data.error || 'Failed to extract measurements')
      }

      setExtractedData(data.measurements || [])
      setStep('review')

    } catch (err: any) {
      console.error('=== FRONTEND EXTRACTION ERROR ===')
      console.error('Error:', err)
      console.error('================================')
      
      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to extract measurements. Please try manual entry.'
      setError(errorMessage)
      setStep('select')
    }
  }

  const handleSave = async () => {
    try {
      setStep('saving')
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Prepare measurements for insert
      // Convert selected date to ISO timestamp
      const measuredAtTimestamp = new Date(measurementDate).toISOString()
      const measurements = extractedData.map(m => ({
        user_id: user.id,
        metric: m.metric,
        value: m.value,
        unit: m.unit,
        source: 'ocr',
        confidence: m.confidence,
        image_url: imageUrl,
        measured_at: measuredAtTimestamp
      }))

      const { error: insertError } = await supabase
        .from('measurements')
        .insert(measurements)

      if (insertError) throw insertError

      setStep('success')
      
      // Redirect after 2 seconds with refresh parameter
      setTimeout(() => {
        router.push('/protected/measurements?refresh=true')
      }, 2000)

    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save measurements')
      setStep('review')
    }
  }

  const handleValueChange = (index: number, newValue: number) => {
    setExtractedData(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], value: newValue }
      return updated
    })
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-2 pb-10">
      {/* Back Button */}
      <div className="mb-2">
        <Link href="/protected/measurements">
          <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </Link>
      </div>

      {/* Title Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-2xl mb-3"
      >
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl opacity-50" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl opacity-30" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="h-5 w-5 text-white/90" />
            <h1 className="text-xl font-semibold tracking-tight">Upload Report</h1>
          </div>
          <p className="text-xs text-white/70">Upload your InBody or body composition report</p>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Upload Section */}
      {step === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <FileImage className="h-10 w-10 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select an Image</h3>
              <p className="text-sm text-white/60 mb-6">
                Take a photo or upload an existing image of your body composition report
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture')
                      fileInputRef.current.click()
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full rounded-lg max-h-96 object-contain bg-black/20"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  Extract Data
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Processing State */}
      {(step === 'uploading' || step === 'processing') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-2xl text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {step === 'uploading' ? 'Uploading Image...' : 'Extracting Measurements...'}
          </h3>
          <p className="text-sm text-white/60">
            {step === 'uploading' ? 'Please wait while we upload your image' : 'AI is analyzing your report'}
          </p>
        </motion.div>
      )}

      {/* Review State */}
      {step === 'review' && extractedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Measurement Date */}
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
            <label className="block text-xs font-light text-white/70 mb-2">Measurement Date</label>
            <input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg bg-white/10 backdrop-blur-xl px-3 py-2 text-sm text-white focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
            />
            <p className="text-xs text-white/50 mt-1">When were these measurements taken?</p>
          </div>

          {/* Extracted Data */}
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
            <h3 className="text-sm font-semibold text-white mb-3">Review Extracted Data ({extractedData.length} measurements)</h3>
            <div className="space-y-2">
              {extractedData.map((measurement, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <div className="flex-1">
                    <div className="text-xs text-white/50 capitalize">
                      {measurement.metric.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={measurement.value}
                    onChange={(e) => handleValueChange(index, parseFloat(e.target.value))}
                    className="w-24 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
                  />
                  <span className="text-sm text-white/60 w-12">{measurement.unit}</span>
                  {measurement.confidence && (
                    <span className="text-xs text-white/40">
                      {Math.round(measurement.confidence * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep('select')
                setSelectedFile(null)
                setPreviewUrl(null)
                setExtractedData([])
              }}
              className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              Save Measurements
            </button>
          </div>
        </motion.div>
      )}

      {/* Saving State */}
      {step === 'saving' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-2xl text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Saving...</h3>
          <p className="text-sm text-white/60">Storing your measurements</p>
        </motion.div>
      )}

      {/* Success State */}
      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-8 backdrop-blur-2xl text-center"
        >
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Success!</h3>
          <p className="text-sm text-white/60">Measurements saved. Redirecting...</p>
        </motion.div>
      )}
    </section>
  )
}
