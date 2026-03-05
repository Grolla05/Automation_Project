import React from 'react';
import { twMerge } from 'tailwind-merge';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  type = 'button',
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-apple font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-opacity-50 active:scale-95 cursor-pointer disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center";
  
  const variants = {
    primary: "bg-apple-text text-apple-white hover:opacity-90 shadow-apple",
    secondary: "bg-apple-white text-apple-text border border-apple-gray hover:bg-apple-bg shadow-apple",
    ghost: "bg-transparent text-apple-text hover:bg-apple-gray",
    blue: "bg-apple-blue text-white hover:bg-blue-600 shadow-apple"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
