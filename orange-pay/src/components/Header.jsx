import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

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
          <svg
            width="22"
            height="18"
            viewBox="0 0 22 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-900"
            >
            <path
                d="M1.3999 9H20.5999M1.3999 9L9.3999 1M1.3999 9L9.3999 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            </svg>
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

Header.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  right: PropTypes.node,
  className: PropTypes.string,
  centerTitle: PropTypes.bool,
};
