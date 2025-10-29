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
    </div>
  )
}
