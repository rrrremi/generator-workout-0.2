import React, { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    
    const baseStyles = 'px-2.5 py-1.5 bg-white/5 border border-transparent rounded-md text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50 w-full transition-all duration-200 text-sm'
    const errorStyles = error ? 'border-red-500/50 focus:border-red-500/70' : ''
    const focusStyles = isFocused ? 'border-fuchsia-500/50 shadow-[0_0_0_1px_rgba(217,70,219,0.1)]' : ''
    const combinedClassName = `${baseStyles} ${errorStyles} ${focusStyles} ${className}`
    
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={props.id} className="block text-xs font-medium text-white/80 mb-0.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50">
              {icon}
            </div>
          )}
          <input 
            ref={ref} 
            className={`${combinedClassName} ${icon ? 'pl-10' : ''}`} 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props} 
          />
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-red-400 text-xs mt-1">
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
