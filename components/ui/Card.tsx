import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`border border-black rounded-md p-6 ${className}`}>
      {children}
    </div>
  )
}
