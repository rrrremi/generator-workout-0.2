"use client";

import React from 'react';

const Button = ({ 
  children, 
  variant = "primary", 
  size = "medium", 
  className = "", 
  onClick,
  disabled = false,
  type = "button",
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 focus-visible:ring-black",
    secondary: "bg-white text-black border border-black hover:bg-gray-100 focus-visible:ring-black",
    outline: "bg-transparent border border-black text-black hover:bg-gray-100 focus-visible:ring-black",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
    ghost: "bg-transparent hover:bg-gray-100 text-black focus-visible:ring-black",
  };

  const sizes = {
    small: "h-8 px-3 text-sm",
    medium: "h-10 px-4 py-2",
    large: "h-12 px-6 py-3 text-lg",
  };

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.medium;
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
