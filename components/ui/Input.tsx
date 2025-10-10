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
    
    const baseStyles = 'px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 w-full transition-colors text-sm font-light backdrop-blur-xl'
    const errorStyles = error ? 'border-red-500/50 focus:border-red-500/70' : ''
    const focusStyles = ''
    const combinedClassName = `${baseStyles} ${errorStyles} ${focusStyles} ${className}`
    
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={props.id} className="block text-xs font-light text-white/70 mb-1.5">
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
