'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface ExerciseContextMenuProps {
  isOpen: boolean
  onDelete: () => void
  onClose: () => void
  exerciseName: string
}

export default function ExerciseContextMenu({
  isOpen,
  onDelete,
  onClose,
  exerciseName
}: ExerciseContextMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Context Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 rounded-lg border border-white/10 bg-black/90 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                onClose()
              }}
              className="w-full flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
