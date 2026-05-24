import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const LoginInputField = ({
  id,
  label,
  type = 'text',
  value,
  error,
  showToggle = false,
  isVisible = false,
  onToggle,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
  maxLength,
}) => {
  const inputType = showToggle ? (isVisible ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`peer h-14 w-full rounded-xl border bg-white px-4 pt-5 text-sm text-black outline-none transition duration-200 placeholder:text-transparent focus:bg-white ${
            error
              ? 'border-red-500/70 focus:border-red-500'
              : 'border-black/12 focus:border-black/70 focus:shadow-[0_0_0_4px_rgba(62,52,38,0.09)]'
          } ${showToggle ? 'pr-12' : ''}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-zinc-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-black"
        >
          {label}
        </label>
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-500 transition hover:bg-black/5 hover:text-black"
          >
            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};
