import React from 'react';
import { cn } from '../utils/cn';

export const Card = ({ className, children, ...props }) => {
  return (
    <div className={cn("bg-white border border-brown-200 rounded-2xl shadow-sm overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn("px-6 py-5 border-b border-brown-100 bg-beige-50/50", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn("text-lg font-semibold text-brown-800", className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
};
