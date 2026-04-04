import React from 'react';
import { cn } from '../utils/cn';

export const Card = ({ className, children, ...props }) => {
  return (
    <div className={cn("bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn("px-6 py-5 border-b border-blue-100 bg-slate-50/50", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn("text-lg font-semibold text-blue-800", className)} {...props}>
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
