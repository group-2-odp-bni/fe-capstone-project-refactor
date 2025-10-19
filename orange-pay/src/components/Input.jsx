import React from 'react';

export default function Input({
  value, onChange, placeholder = '', type = 'text', className = '', ...rest
}) {
  return (
    <input
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className={`w-full border-b p-3 text-lg outline-none mb-4 ${className}`}
      {...rest}
    />
  );
}
