import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative bg-white rounded-2xl shadow-2xl border border-brown-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto",
        className
      )}>
        <div className="flex items-center justify-between p-6 border-b border-brown-100">
          <h2 className="text-lg font-bold text-brown-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-brown-400 hover:bg-beige-100 hover:text-brown-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
