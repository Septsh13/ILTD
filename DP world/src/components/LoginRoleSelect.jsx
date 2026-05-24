import React from 'react';

const roles = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

export const LoginRoleSelect = ({ value, onChange }) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
      Access Role
    </span>
    <select
      value={value}
      onChange={onChange}
      className="h-14 w-full rounded-xl border border-black/12 bg-white px-4 text-sm font-medium text-black outline-none transition focus:border-black/70 focus:shadow-[0_0_0_4px_rgba(62,52,38,0.09)]"
    >
      {roles.map((role) => (
        <option key={role.value} value={role.value} className="bg-white text-black">
          {role.label}
        </option>
      ))}
    </select>
  </label>
);
