'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface WorkoutRatingProps {
  workoutId: string
  initialRating?: number | null
  onRatingChange?: (rating: number) => void
  disabled?: boolean
}

export default function WorkoutRating({
  workoutId,
  initialRating,
  onRatingChange,
  disabled = false
}: WorkoutRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating || null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingClick = async (selectedRating: number) => {
    if (disabled || isSubmitting) return

    setIsSubmitting(true)
    setRating(selectedRating)

    try {
      const response = await fetch('/api/workouts/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId,
          rating: selectedRating
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save rating')
      }

      onRatingChange?.(selectedRating)
    } catch (error) {
      console.error('Error saving rating:', error)
      // Revert on error
      setRating(initialRating || null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map((value) => {
          const isSelected = rating !== null && value <= rating
          const isHovered = hoveredRating !== null && value <= hoveredRating
          const shouldFill = isSelected || isHovered

          return (
            <motion.button
              key={value}
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => !disabled && setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(null)}
              disabled={disabled || isSubmitting}
              whileHover={{ scale: disabled ? 1 : 1.15 }}
              whileTap={{ scale: disabled ? 1 : 0.9 }}
              className={`
                h-3 w-3 rounded-full border transition-all duration-200
                ${shouldFill
                  ? 'border-white/60 bg-white/90'
                  : 'border-white/30 bg-transparent hover:bg-white/20'
                }
                ${disabled || isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
              aria-label={`Rate ${value} out of 6`}
            />
          )
        })}
      </div>
    </div>
  )
}
