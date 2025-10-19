import React from 'react'
import BellIcon from '@heroicons/react/24/outline/BellIcon'

// HeaderSection.jsx — responsive fix: align text properly on mobile with custom color for Welcome back
export default function HeaderSection({
  name = 'Ahong',
  avatarSrc = '/avatar.png',
  onBellClick,
}) {
  return (
    <div className="relative flex items-center justify-between sm:py-6 sm:px-8">
      {/* Left section: avatar + greeting */}
      <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
        <img
          src={avatarSrc}
          alt="avatar"
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow ring-2 ring-base-200 flex-shrink-0"
        />
        <div className="flex flex-col justify-center text-left">
          <p className="text-xl sm:text-3xl font-extrabold leading-snug">Hi {name}!</p>
          <p className="text-lg sm:text-xl font-semibold leading-snug" style={{ color: '#FF9A25' }}>Welcome back</p>
        </div>
      </div>

      {/* Notification icon (center-right on mobile) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0">
        <button
          type="button"
          aria-label="Open notifications"
          className="btn btn-ghost btn-circle scale-110 sm:scale-125"
          onClick={onBellClick}
        >
          <div className="indicator">
            <BellIcon className="w-8 h-8 sm:w-10 sm:h-10 text-base-content/70" />
            <span className="indicator-item badge badge-sm bg-base-content/70 border-none" />
          </div>
        </button>
      </div>
    </div>
  )
}