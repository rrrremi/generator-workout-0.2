import { motion } from 'framer-motion'
import { RefreshCw, Trash2 } from 'lucide-react'

interface DeleteWorkoutModalProps {
  open: boolean
  isDeleting?: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

export default function DeleteWorkoutModal({
  open,
  isDeleting = false,
  onCancel,
  onConfirm,
  title = 'Delete Workout',
  description = 'Are you sure you want to delete this workout? This cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: DeleteWorkoutModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-lg border border-transparent bg-white/5 backdrop-blur-2xl p-3 max-w-xs w-full"
      >
        <h3 className="text-sm font-medium text-white/90 mb-1.5">{title}</h3>
        <p className="text-xs text-white/70 mb-3">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-transparent bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10 transition-colors"
            disabled={isDeleting}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
            disabled={isDeleting}
          >
            {isDeleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            {isDeleting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
