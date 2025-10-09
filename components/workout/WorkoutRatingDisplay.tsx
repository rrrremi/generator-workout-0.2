'use client'

interface WorkoutRatingDisplayProps {
  rating?: number | null
}

export default function WorkoutRatingDisplay({ rating }: WorkoutRatingDisplayProps) {
  if (!rating) return null

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6].map((value) => {
        const isFilled = value <= rating

        return (
          <div
            key={value}
            className={`
              h-1.5 w-1.5 rounded-full border transition-all
              ${isFilled
                ? 'border-white/60 bg-white/90'
                : 'border-white/30 bg-transparent'
              }
            `}
          />
        )
      })}
    </div>
  )
}
