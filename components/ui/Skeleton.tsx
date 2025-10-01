'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'glassmorphism'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'glassmorphism'
}) => {
  const baseClasses = 'animate-pulse rounded-lg'
  const variantClasses = {
    default: 'bg-gray-200',
    glassmorphism: 'bg-white/10'
  }

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  )
}

interface SkeletonCardProps {
  className?: string
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-2xl border border-transparent bg-white/5 backdrop-blur-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="glassmorphism" className="h-4 w-32" />
        <Skeleton variant="glassmorphism" className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        <Skeleton variant="glassmorphism" className="h-4 w-full" />
        <Skeleton variant="glassmorphism" className="h-4 w-3/4" />
        <Skeleton variant="glassmorphism" className="h-4 w-1/2" />
      </div>
    </div>
  )
}

interface SkeletonListProps {
  count?: number
  className?: string
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-xl border border-transparent bg-white/5 backdrop-blur-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="glassmorphism" className="w-8 h-8 rounded-full" />
              <Skeleton variant="glassmorphism" className="h-5 w-48" />
            </div>
            <Skeleton variant="glassmorphism" className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Skeleton variant="glassmorphism" className="h-4 w-20" />
            <Skeleton variant="glassmorphism" className="h-4 w-24" />
            <Skeleton variant="glassmorphism" className="h-4 w-18" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface SkeletonFormProps {
  className?: string
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Skeleton variant="glassmorphism" className="h-4 w-24" />
        <Skeleton variant="glassmorphism" className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="glassmorphism" className="h-4 w-20" />
        <Skeleton variant="glassmorphism" className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="glassmorphism" className="h-4 w-32" />
        <Skeleton variant="glassmorphism" className="h-20 w-full rounded-xl" />
      </div>
      <Skeleton variant="glassmorphism" className="h-12 w-32 rounded-xl" />
    </div>
  )
}

interface SkeletonWorkoutDetailProps {
  className?: string
}

export const SkeletonWorkoutDetail: React.FC<SkeletonWorkoutDetailProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-transparent bg-white/5 p-8 backdrop-blur-2xl">
        <Skeleton variant="glassmorphism" className="h-8 w-64 mb-2" />
        <Skeleton variant="glassmorphism" className="h-4 w-80" />
        <div className="flex gap-3 mt-6">
          <Skeleton variant="glassmorphism" className="h-12 w-32 rounded-xl" />
          <Skeleton variant="glassmorphism" className="h-12 w-8 rounded-xl" />
        </div>
      </div>

      {/* Overview */}
      <SkeletonCard />

      {/* Exercises */}
      <div className="rounded-2xl border border-transparent bg-white/5 backdrop-blur-xl p-6">
        <Skeleton variant="glassmorphism" className="h-6 w-48 mb-6" />
        <SkeletonList count={4} />
      </div>
    </div>
  )
}

interface SkeletonDashboardProps {
  className?: string
}

export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-transparent bg-white/5 p-8 backdrop-blur-2xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="grid gap-6 md:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            <Skeleton variant="glassmorphism" className="h-6 w-64" />
            <Skeleton variant="glassmorphism" className="h-8 w-80" />
            <Skeleton variant="glassmorphism" className="h-4 w-96" />
            <div className="flex gap-3">
              <Skeleton variant="glassmorphism" className="h-12 w-32 rounded-xl" />
              <Skeleton variant="glassmorphism" className="h-12 w-28 rounded-xl" />
            </div>
          </div>
          <SkeletonCard />
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

// ProgressiveWorkoutGeneration component has been moved to its own file
// for code splitting optimization
