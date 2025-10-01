'use client'

import React from 'react'
import { motion } from 'framer-motion'
import PsychedelicBackground from '@/components/layout/PsychedelicBackground'

interface ProgressiveWorkoutGenerationProps {
  isVisible: boolean
  currentStep: number
  steps: string[]
  className?: string
}

export const ProgressiveWorkoutGeneration: React.FC<ProgressiveWorkoutGenerationProps> = ({
  isVisible,
  currentStep,
  steps,
  className = ''
}) => {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 ${className}`}
    >
      <PsychedelicBackground />
      <div className="relative z-10 bg-white/5 backdrop-blur-xl rounded-2xl border border-transparent p-6 max-w-xs w-full mx-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white/20 border-t-white/90"
          />
          <h3 className="text-base text-white/90 mb-1">Generating Workout</h3>
          <p className="text-xs text-white/50">Please wait a moment...</p>
        </div>
      </div>
    </motion.div>
  )
}

export default ProgressiveWorkoutGeneration
