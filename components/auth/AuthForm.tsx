'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'

interface AuthFormProps {
  title: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  error?: string | null
}

export default function AuthForm({
  title,
  description,
  footer,
  children,
  onSubmit,
  error
}: AuthFormProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-start justify-center pt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Removed Logo/Brand */}

          {/* Form Card */}
          <div className="rounded-lg border border-transparent bg-white/5 p-4 backdrop-blur-2xl shadow-lg shadow-black/5">
            <div className="text-center mb-3">
              <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">{title}</h1>
              {description && <p className="mt-0.5 text-xs text-white/60">{description}</p>}
            </div>

            {onSubmit ? (
              <form className="space-y-3" onSubmit={onSubmit}>
                <div className="space-y-3">
                  {children}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300 backdrop-blur-xl flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </motion.div>
                )}

                {footer && <div className="mt-4">{footer}</div>}
              </form>
            ) : (
              <div className="space-y-3">
                <div className="space-y-3">
                  {children}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300 backdrop-blur-xl flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </motion.div>
                )}

                {footer && <div className="mt-4">{footer}</div>}
              </div>
            )}
          </div>

          {/* Removed Footer Links */}
        </motion.div>
      </div>
    </div>
  )
}
