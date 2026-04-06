'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  type FitPreference,
  type SizeMeasurements,
  type SizeRecommendationResult,
  getRecommendedSize,
  validateMeasurements
} from '@/lib/sizeRecommendation'

interface SizeAdvisorModalProps {
  isOpen: boolean
  onClose: () => void
  availableSizes: string[]
  onSizeSelect: (size: string) => void
  savedMeasurements?: SizeMeasurements | null
  onSaveMeasurements: (m: SizeMeasurements) => void
  isLoggedIn: boolean
}

type Step = 'form' | 'result'

export default function SizeAdvisorModal({
  isOpen,
  onClose,
  availableSizes,
  onSizeSelect,
  savedMeasurements,
  onSaveMeasurements,
  isLoggedIn
}: SizeAdvisorModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [chest, setChest] = useState('')
  const [shoulder, setShoulder] = useState('')
  const [fit, setFit] = useState<FitPreference | null>(null)
  const [result, setResult] = useState<SizeRecommendationResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showHowToMeasure, setShowHowToMeasure] = useState(false)

  // On mount or when savedMeasurements change
  useEffect(() => {
    if (isOpen && savedMeasurements) {
      setChest(savedMeasurements.chest.toString())
      setShoulder(savedMeasurements.shoulder.toString())
      setFit(savedMeasurements.fit)
      
      const res = getRecommendedSize(savedMeasurements, availableSizes)
      setResult(res)
      setStep('result')
    }
  }, [isOpen, savedMeasurements, availableSizes])

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!isOpen) return null

  const handleGetRecommendation = () => {
    const c = parseFloat(chest)
    const s = parseFloat(shoulder)
    const validation = validateMeasurements(c, s)

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid measurements')
      return
    }

    if (!fit) {
      setValidationError('Please select a fit preference')
      return
    }

    setValidationError(null)
    const measurements: SizeMeasurements = { chest: c, shoulder: s, fit }
    const res = getRecommendedSize(measurements, availableSizes)
    setResult(res)
    setStep('result')
  }

  const handleFinalSelection = () => {
    if (!result) return
    const sizeToSelect = result.isAvailable ? result.recommendedSize : result.fallbackSize
    if (sizeToSelect) {
      onSizeSelect(sizeToSelect)
      onSaveMeasurements({
        chest: parseFloat(chest),
        shoulder: parseFloat(shoulder),
        fit: fit!
      })
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[180] bg-black/95 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto py-8">
          {/* Header */}
          <header className="flex justify-between items-center pb-5 border-b border-white/10 mb-2">
            <span className="text-white text-xs tracking-widest uppercase">📐 FIND YOUR SIZE</span>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </header>

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="py-6 space-y-8"
              >
                {/* How to measure */}
                <div>
                  <button
                    onClick={() => setShowHowToMeasure(!showHowToMeasure)}
                    className="flex items-center gap-1.5 text-gray-400 text-[10px] tracking-widest uppercase hover:text-white transition-colors"
                  >
                    How to measure? {showHowToMeasure ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <AnimatePresence>
                    {showHowToMeasure && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-white/60 text-[10px] tracking-widest uppercase mb-1">CHEST</p>
                            <p className="text-white/40 text-[10px] leading-relaxed">
                              Measure around the fullest part of your chest, keeping the tape parallel to the ground.
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-[10px] tracking-widest uppercase mb-1">SHOULDER</p>
                            <p className="text-white/40 text-[10px] leading-relaxed">
                              Measure from the edge of one shoulder seam to the other across the back.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-2">CHEST</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="e.g. 40"
                        min="28"
                        max="60"
                        step="0.5"
                        value={chest}
                        onChange={(e) => setChest(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">inches</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-2">SHOULDER WIDTH</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="e.g. 17.5"
                        min="12"
                        max="28"
                        step="0.5"
                        value={shoulder}
                        onChange={(e) => setShoulder(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">inches</span>
                    </div>
                  </div>
                </div>

                {/* Fit Preference */}
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-3">HOW DO YOU LIKE YOUR FIT?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <FitButton
                      selected={fit === 'fitted'}
                      onClick={() => setFit('fitted')}
                      title="✂️ Fitted"
                      subtitle="Close to body"
                    />
                    <FitButton
                      selected={fit === 'regular'}
                      onClick={() => setFit('regular')}
                      title="👕 Regular"
                      subtitle="Classic comfortable"
                    />
                    <FitButton
                      selected={fit === 'relaxed'}
                      onClick={() => setFit('relaxed')}
                      title="😌 Relaxed"
                      subtitle="Slightly loose"
                    />
                    <FitButton
                      selected={fit === 'oversized'}
                      onClick={() => setFit('oversized')}
                      title="🌊 Oversized"
                      subtitle="Baggy streetwear"
                    />
                  </div>
                </div>

                {validationError && (
                  <p className="text-red-400 text-[10px] tracking-widest mt-2">{validationError}</p>
                )}

                <button
                  onClick={handleGetRecommendation}
                  disabled={!chest || !shoulder || !fit}
                  className="w-full bg-white text-black py-4 mt-6 text-xs tracking-widest uppercase font-medium hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Get My Size →
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="py-6 text-center"
              >
                <p className="text-[10px] tracking-widest uppercase text-white/40 mb-4">YOUR RECOMMENDED SIZE</p>

                <p className="text-9xl font-extralight text-white tracking-wider">
                  {result?.isAvailable ? result.recommendedSize : result?.fallbackSize ?? 'N/A'}
                </p>

                <p className="text-white/30 text-[10px] tracking-widest mt-2">
                  {result?.sizeRange}
                </p>

                <div className="mt-3">
                  {result?.isAvailable ? (
                    <p className="text-green-400 text-[10px] tracking-widest uppercase">✓ Available in this product</p>
                  ) : result?.fallbackSize ? (
                    <>
                      <p className="text-white/30 text-[10px] tracking-widest uppercase">{result?.recommendedSize} not in stock for this product</p>
                      <p className="text-white/40 text-[10px] mt-1 tracking-widest uppercase">Showing nearest available size: {result?.fallbackSize}</p>
                    </>
                  ) : (
                    <p className="text-white/30 text-[10px] tracking-widest uppercase">This product may not have your size available</p>
                  )}
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <p className="text-white/20 text-[10px] tracking-widest uppercase">
                    Based on: {result?.basedOn === 'both' ? 'Chest & Shoulder' : result?.basedOn === 'shoulder' ? 'Shoulder width (priority)' : 'Chest measurement'}
                    {result?.fitAdjusted && ` · Adjusted for ${fit} fit`}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex justify-center gap-6">
                    <span className="text-[10px] tracking-widest uppercase text-white/25">CHEST {chest}"</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/25">·</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/25">SHOULDER {shoulder}"</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/25">·</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/25">{fit?.toUpperCase()} FIT</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 border border-white/30 text-white/60 px-5 py-3 text-xs tracking-widest uppercase hover:border-white hover:text-white transition-colors"
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={handleFinalSelection}
                    disabled={!result?.isAvailable && !result?.fallbackSize}
                    className="flex-2 bg-white text-black px-8 py-3 text-xs tracking-widest uppercase font-medium hover:bg-gray-100 transition-colors disabled:opacity-30"
                  >
                    Select Size {result?.isAvailable ? result.recommendedSize : result?.fallbackSize}
                  </button>
                </div>

                {!isLoggedIn && (
                  <p className="text-white/20 text-[10px] tracking-widest text-center mt-4 uppercase">
                    Log in to save your measurements for next time
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function FitButton({ selected, onClick, title, subtitle }: { selected: boolean, onClick: () => void, title: string, subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 px-4 text-left transition-colors border",
        selected 
          ? "border-white bg-white text-black" 
          : "border-white/20 bg-transparent text-white/60 hover:border-white/40"
      )}
    >
      <p className="text-xs tracking-widest uppercase font-medium">{title}</p>
      <p className={cn("text-[10px] mt-0.5 uppercase tracking-wider", selected ? "opacity-60" : "opacity-40")}>{subtitle}</p>
    </button>
  )
}
