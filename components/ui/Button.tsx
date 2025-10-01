import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-ring'
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white hover:brightness-110 active:brightness-90',
    secondary: 'bg-white/10 text-white border border-transparent hover:bg-white/20 active:bg-white/5',
    outline: 'bg-transparent text-white border border-transparent hover:bg-white/5 active:bg-transparent',
    ghost: 'bg-transparent text-white/80 hover:bg-white/10 hover:text-white active:bg-white/5',
  }
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  const widthStyles = fullWidth ? 'w-full' : ''
  const disabledStyles = (disabled || isLoading) ? 'opacity-60 cursor-not-allowed' : ''
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className}`
  
  return (
    <button 
      className={combinedClassName} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={isLoading ? 'opacity-0' : 'flex items-center gap-2'}>
        {leftIcon && <span className="-ml-1">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="-mr-1">{rightIcon}</span>}
      </span>
    </button>
  )
}
