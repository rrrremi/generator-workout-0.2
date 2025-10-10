'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Trash2 } from 'lucide-react'

interface DeleteExerciseModalProps {
  open: boolean
  isDeleting: boolean
  exerciseName: string
  isLastExercise: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteExerciseModal({
  open,
  isDeleting,
  exerciseName,
  isLastExercise,
  onCancel,
  onConfirm
}: DeleteExerciseModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={isDeleting ? undefined : onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-lg border border-transparent bg-white/5 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-transparent p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-light text-white/90">Delete Exercise</h3>
              </div>
              {!isDeleting && (
                <button
                  onClick={onCancel}
                  className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm font-light text-white/80">
                Are you sure you want to delete <span className="font-normal text-white/90">"{exerciseName}"</span> from this workout?
              </p>
              
              {isLastExercise && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs font-light text-amber-200/90">
                    This is the last exercise in the workout. The workout will be empty after deletion.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-transparent p-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-light text-white/90 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-light text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
