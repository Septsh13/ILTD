import React from 'react';
import { cn } from '../utils/cn';

export const Table = ({ className, children, ...props }) => (
  <div className="w-full overflow-auto rounded-xl border border-blue-200 bg-white">
    <table className={cn("w-full text-sm text-left", className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ className, children, ...props }) => (
  <thead className={cn("text-xs text-blue-600 uppercase bg-slate-50 border-b border-blue-200", className)} {...props}>
    {children}
  </thead>
);

export const TableRow = ({ className, children, ...props }) => (
  <tr className={cn("border-b last:border-0 border-blue-100 hover:bg-slate-50/50 transition-colors", className)} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ className, children, ...props }) => (
  <th className={cn("px-6 py-4 font-medium", className)} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className, children, ...props }) => (
  <td className={cn("px-6 py-4 text-blue-800", className)} {...props}>
    {children}
  </td>
);
