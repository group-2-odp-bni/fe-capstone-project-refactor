import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({
  title = '',
  subtitle = '',
  showBack = true,
  onBack = null,
  right = null,
  className = '',
  centerTitle = true,
}) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof onBack === 'function') return onBack();
    navigate(-1);
  };

  return (
    <div className={`w-full flex items-center gap-2 mb-6 ${className}`}>
      {showBack ? (
        <button onClick={handleBack} aria-label="Back" className="p-1 -ml-1">
          <span className="text-2xl">←</span>
        </button>
      ) : (
        <div className="w-8" />
      )}

      <div className={`flex-1 ${centerTitle ? 'text-center' : ''}`}>
        {title && <h1 className="text-xl font-bold">{title}</h1>}
        {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
      </div>

      <div className="w-6">{right && <div className="flex items-center justify-end">{right}</div>}</div>
    </div>
  );
}
