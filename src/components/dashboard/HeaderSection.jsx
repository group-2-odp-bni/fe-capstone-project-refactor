// HeaderSection.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import BellIcon from '@heroicons/react/24/outline/BellIcon'

export default function HeaderSection({
  name = 'Ahong',
  avatarSrc = '/avatar.png',
  onBellClick,
  unreadCount = 0,
}) {
  const navigate = useNavigate()

  const handleProfileClick = () => {
    navigate("/app/profile");
  };
  

  return (
    <div className="relative flex items-center justify-between sm:py-2 sm:px-8">
      {/* Left section: avatar + greeting (clickable) */}
      <div
        className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto cursor-pointer transition hover:opacity-90 active:scale-[0.98]"
        onClick={handleProfileClick}
      >
        <img
          src={avatarSrc}
          alt="avatar"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow ring-2 ring-base-200 flex-shrink-0"
        />
        <div className="flex flex-col justify-center text-left">
          <p className="text-lg sm:text-xl font-extrabold leading-snug">Hi {name}!</p>
          <p
            className="text-sm sm:text-l font-semibold leading-snug"
            style={{ color: '#FF9A25' }}
          >
            Welcome back
          </p>
        </div>
      </div>

      {/* Notification icon */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0">
        <button
          type="button"
          aria-label="Open notifications"
          className="btn btn-ghost btn-circle scale-105 sm:scale-110"
          onClick={onBellClick}
        >
          <div className="indicator">
            <BellIcon className="w-6 h-6 sm:w-8 sm:h-8 text-base-content/70" />
            {unreadCount > 0 && (
              <span className="indicator-item badge badge-sm bg-base-content/70 border-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
