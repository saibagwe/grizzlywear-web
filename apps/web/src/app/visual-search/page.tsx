'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Loader2, AlertTriangle, X, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type VisualSearchMatch = {
  productId: string
  slug: string
  name: string
  price: number
  comparePrice: number | null
  category: string
  imageUrl: string
  inStock: boolean
  score: number
}

type Step = 'idle' | 'searching' | 'results' | 'error'

export default function VisualSearchPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [results, setResults] = useState<VisualSearchMatch[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    }
  }, [uploadedPreview])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB.')
      return
    }
    processFile(file)
  }

  const processFile = (file: File) => {
    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    setUploadedFile(file)
    setUploadedPreview(URL.createObjectURL(file))
    setStep('idle')
    setResults([])
    setErrorMessage(null)
  }

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
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB.')
      return
    }
    processFile(file)
  }

  const handleSearch = async () => {
    if (!uploadedFile) return
    setStep('searching')

    const reader = new FileReader()
    reader.readAsDataURL(uploadedFile)
    reader.onload = async () => {
      try {
        const response = await fetch('/api/visual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Search failed')

        setResults(data.matches || [])
        setStep('results')
      } catch (err: any) {
        setErrorMessage(err.message)
        setStep('error')
      }
    }
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.')
      setStep('error')
    }
  }

  const reset = () => {
    setUploadedFile(null)
    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    setUploadedPreview(null)
    setStep('idle')
    setResults([])
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header */}
      <header className="border-b border-gray-100 py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-black">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight uppercase">
            Visual Search
          </h1>
          <p className="text-sm text-gray-400 uppercase tracking-widest mt-4">
            Upload any photo to find visually similar styles
          </p>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-16 max-w-2xl mx-auto"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-[300px] w-full border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden",
                  isDragging ? "border-black bg-gray-50 scale-[1.01]" : 
                  uploadedPreview ? "border-gray-300" : "border-gray-200 hover:border-gray-400"
                )}
              >
                {!uploadedPreview ? (
                  <>
                    <Camera size={36} className="text-gray-200 mb-4" />
                    <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">DROP YOUR PHOTO HERE</p>
                    <p className="text-xs text-gray-300 mt-1 uppercase tracking-wider">or click to browse</p>
                    <p className="text-[10px] text-gray-200 uppercase tracking-widest mt-6 font-bold">JPG · PNG · WEBP · Max 10MB</p>
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <img src={uploadedPreview} className="w-full h-full object-cover" alt="Query" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 py-2 text-center">
                      <p className="text-white text-[10px] tracking-widest uppercase flex items-center justify-center gap-1">
                        <X size={12} /> Click to change
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                {!uploadedFile ? (
                  <button className="bg-gray-100 text-gray-300 cursor-not-allowed px-12 py-4 text-xs tracking-widest uppercase font-bold">
                    <Search size={14} className="inline-block mr-2" /> Search Similar Styles
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSearch}
                      className="bg-black text-white px-12 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors"
                    >
                      <Search size={14} className="inline-block mr-2" /> Search Similar Styles
                    </button>
                    <button
                      onClick={reset}
                      className="border border-gray-200 text-gray-400 px-8 py-4 text-xs tracking-widest uppercase hover:border-black hover:text-black transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-32 text-center"
            >
              <div className="flex flex-col items-center">
                <Loader2 size={28} className="animate-spin text-gray-300 mx-auto" />
                <h3 className="text-sm uppercase tracking-widest text-gray-500 mt-6 font-bold">Analyzing your photo...</h3>
                <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">Finding visually similar styles in our collection</p>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-16"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Your Photo</span>
                    {uploadedPreview && (
                      <img src={uploadedPreview} className="w-16 h-16 object-cover border border-gray-200" alt="Query Profile" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-light tracking-tight uppercase">
                      {results.length} SIMILAR STYLES FOUND
                    </h2>
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="border border-black text-black px-6 py-3 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
                >
                  ↩ Search Again
                </button>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mt-10">
                  {results.map((match) => (
                    <Link key={match.productId} href={`/shop/${match.slug}`} className="group block">
                      <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
                        <img 
                          src={match.imageUrl} 
                          alt={match.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-black text-white text-[9px] tracking-widest uppercase px-2 py-1 font-bold">
                            {match.score}% MATCH
                          </span>
                        </div>

                        {!match.inStock && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                            <span className="text-[10px] tracking-widest uppercase text-gray-500 font-bold">OUT OF STOCK</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4 truncate uppercase tracking-tight">
                          {match.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-800 font-bold tracking-wider">₹{match.price.toLocaleString('en-IN')}</p>
                          {match.comparePrice && match.comparePrice > 0 && (
                            <p className="text-sm text-gray-400 line-through tracking-wider">₹{match.comparePrice.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <Search size={28} className="text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">No similar styles found</p>
                  <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">Try a clearer or more detailed photo</p>
                  <Link
                    href="/shop"
                    className="border border-black px-8 py-3 text-xs tracking-widest uppercase inline-block mt-6 hover:bg-black hover:text-white transition-colors"
                  >
                    Browse All Styles →
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-32 text-center"
            >
              <AlertTriangle size={28} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-700 text-lg font-light uppercase tracking-widest">Something went wrong</h3>
              <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto uppercase tracking-wider leading-relaxed">
                {errorMessage || "Please try again with a different photo."}
              </p>
              <button
                onClick={reset}
                className="border border-black px-10 py-3 text-xs tracking-widest uppercase mt-8 hover:bg-black hover:text-white transition-colors inline-block"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
