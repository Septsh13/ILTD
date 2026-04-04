import React from 'react';
import { cn } from '../utils/cn';

export const Table = ({ className, children, ...props }) => (
  <div className="w-full overflow-auto rounded-xl border border-brown-200 bg-white">
    <table className={cn("w-full text-sm text-left", className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ className, children, ...props }) => (
  <thead className={cn("text-xs text-brown-600 uppercase bg-beige-50 border-b border-brown-200", className)} {...props}>
    {children}
  </thead>
);

export const TableRow = ({ className, children, ...props }) => (
  <tr className={cn("border-b last:border-0 border-brown-100 hover:bg-beige-50/50 transition-colors", className)} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ className, children, ...props }) => (
  <th className={cn("px-6 py-4 font-medium", className)} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className, children, ...props }) => (
  <td className={cn("px-6 py-4 text-brown-800", className)} {...props}>
    {children}
  </td>
);
