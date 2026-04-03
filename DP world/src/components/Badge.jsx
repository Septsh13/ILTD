import React from 'react';
import { cn } from '../utils/cn';

export const Badge = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-brown-100 text-brown-800 border-brown-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    resolved: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
