'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Upload, Sparkles, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TryOnModalProps {
  isOpen: boolean
  onClose: () => void
  productImage: string
  productName: string
}

type Step = 'upload' | 'loading' | 'result' | 'error'

export default function TryOnModal({ isOpen, onClose, productImage, productName }: TryOnModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [userImageFile, setUserImageFile] = useState<File | null>(null)
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Progress bar interval
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'loading') {
      setProgress(0)
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + 1.5 // 90/60 = 1.5 per second
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserImageFile(file)
      setUserImagePreview(URL.createObjectURL(file))
    }
  }

  const handleGenerate = async () => {
    if (!userImageFile) return

    setStep('loading')
    setErrorMessage(null)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      
      try {
        const controller = new AbortController()
        abortControllerRef.current = controller
        const timeoutId = setTimeout(() => controller.abort(), 130000)

        const response = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userImageBase64: base64,
            garmentImageUrl: productImage,
            productName: productName
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        const data = await response.json()

        if (response.ok && data.imageUrl) {
          setProgress(100)
          setResultImageUrl(data.imageUrl)
          setStep('result')
        } else {
          throw new Error(data.error || 'Something went wrong')
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setErrorMessage('The request timed out. The AI might be taking longer than usual.')
        } else {
          setErrorMessage(err.message || 'The AI might be warming up. Please wait and try again.')
        }
        setStep('error')
      }
    }
    reader.readAsDataURL(userImageFile)
  }

  const reset = () => {
    setStep('upload')
    setUserImageFile(null)
    if (userImagePreview) URL.revokeObjectURL(userImagePreview)
    setUserImagePreview(null)
    setResultImageUrl(null)
    setErrorMessage(null)
    setProgress(0)
  }

  const handleDownload = async () => {
    if (!resultImageUrl) return
    try {
      const res = await fetch(resultImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'grizzlywear-tryon.jpg'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/95 overflow-y-auto"
      onClick={(e) => {
        if (step !== 'loading' && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="min-h-full w-full flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-5 border-b border-white/10 sticky top-0 bg-black/95 z-30">
          <span className="text-white text-xs tracking-widest uppercase">✨ TRY ON ME</span>
          {step !== 'loading' && (
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </header>

        <main className="flex-1 w-full flex items-center justify-center py-8">
          <div className="w-full max-w-lg mx-auto px-6">
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card 1: YOUR PHOTO */}
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-white/40 mb-2">YOUR PHOTO</p>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[3/4] border border-dashed border-white/20 bg-white/5 cursor-pointer hover:border-white/40 transition-colors flex flex-col items-center justify-center overflow-hidden"
                      >
                        {userImagePreview ? (
                          <img src={userImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload size={24} className="text-white/30" />
                            <p className="text-xs text-white/50 tracking-widest uppercase mt-2">Upload Photo</p>
                            <p className="text-[10px] text-white/25 mt-1">Front-facing · Full body</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Card 2: GARMENT */}
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-white/40 mb-2">GARMENT</p>
                      <div className="aspect-[3/4] border border-white/10 bg-white/5 overflow-hidden relative">
                        <Image src={productImage} alt={productName} fill className="object-cover" />
                      </div>
                      <p className="text-[10px] tracking-widest uppercase text-white/30 text-center mt-2 truncate">
                        {productName}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 text-center text-[10px] text-white/25 tracking-wider">
                    💡 Best results: plain background · full body visible · good lighting
                  </p>

                  <button 
                    onClick={handleGenerate}
                    disabled={!userImageFile}
                    className="mt-6 w-full bg-white text-black py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Generate Try-On →
                  </button>
                </motion.div>
              )}

              {step === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <div className="grid grid-cols-2 gap-4 opacity-30">
                    <div className="aspect-[3/4] border border-white/10 bg-white/5">
                      {userImagePreview && <img src={userImagePreview} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="aspect-[3/4] border border-white/10 bg-white/5 relative">
                      <Image src={productImage} alt="" fill className="object-cover" />
                    </div>
                  </div>

                  <div className="flex justify-center mt-[-100px] mb-[60px] relative z-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    >
                      <Sparkles size={48} className="text-white fill-white" />
                    </motion.div>
                  </div>

                  <h3 className="white text-lg font-light tracking-wide text-center mt-8">
                    Grizz AI is styling you...
                  </h3>
                  <p className="text-white/40 text-xs tracking-widest text-center mt-2">
                    This may take 30–90 seconds. The AI is warming up...
                  </p>

                  <div className="progress-container mt-6">
                    <div className="h-[1px] w-full bg-white/10 relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-white transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <p className="text-[10px] tracking-widest uppercase text-white/40 text-center mb-4">YOUR LOOK</p>
                  
                  <div className="max-w-md mx-auto">
                    <img 
                      src={resultImageUrl || ''} 
                      alt="Try-on result" 
                      className="w-full max-h-[60vh] object-contain mx-auto border border-white/10"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setStep('upload')}
                      className="flex-1 border border-white/30 text-white py-3 text-xs tracking-widest uppercase hover:border-white transition-colors"
                    >
                      ↩ Try Another Photo
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex-1 bg-white text-black py-3 text-xs tracking-widest uppercase font-medium hover:bg-gray-100 transition-colors"
                    >
                      ↓ Download
                    </button>
                  </div>

                  <p className="mt-4 text-center text-[10px] text-white/25 tracking-wider">
                    AI-generated preview. Actual fit may vary slightly.
                  </p>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="text-center py-12"
                >
                  <AlertTriangle size={28} className="text-white/50 mx-auto mb-4" />
                  <h3 className="white text-base font-light mt-2">Something went wrong</h3>
                  <p className="text-white/40 text-xs tracking-widest mt-2 max-w-xs mx-auto uppercase">
                    {errorMessage || "The AI might be warming up. Please wait and try again."}
                  </p>

                  <button 
                    onClick={() => setStep('upload')}
                    className="mt-8 bg-white text-black px-10 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-gray-100"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
