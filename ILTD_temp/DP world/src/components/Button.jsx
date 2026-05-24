import React from 'react';
import { cn } from '../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
  const variants = {
    primary: 'bg-brown-600 text-white hover:bg-brown-700 shadow-sm active:bg-brown-800',
    secondary: 'bg-beige-200 text-brown-800 hover:bg-beige-300 border border-brown-200 shadow-sm',
    outline: 'border-2 border-brown-600 text-brown-600 hover:bg-brown-50',
    ghost: 'text-brown-600 hover:bg-beige-100',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base font-medium',
    icon: 'h-10 w-10 p-2',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brown-500 disabled:pointer-events-none disabled:opacity-50 ring-offset-white',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
