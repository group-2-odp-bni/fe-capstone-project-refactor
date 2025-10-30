import React from "react";
import { useNavigate } from "react-router-dom";
import ButtonLink from "../button/ButtonLink"; // adjust path if needed

export default function UserInfoCard({ name, email, phone, phoneVerified, emailVerified , emailVerifyLink, phoneVerifyLink}) {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl font-sans">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Akun Saya
      </h2>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nama :
          </label>
          <input
            type="text"
            value={name}
            readOnly
            className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none cursor-default"
          />
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email :
            </label>
            <span
              className={`text-xs font-medium ${
                emailVerified ? "text-green-600" : "text-red-500"
              }`}
            >
              {emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none cursor-default"
          />
          {!emailVerified && email && (
            <ButtonLink
              onClick={() => navigate({emailVerifyLink})}
              className="mt-1 text-sm"
            >
              Verifikasi email
            </ButtonLink>
          )}
        </div>

        {/* Phone */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nomor Telepon :
            </label>
            <span
              className={`text-xs font-medium ${
                phoneVerified ? "text-green-600" : "text-red-500"
              }`}
            >
              {phoneVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          <input
            type="tel"
            value={phone}
            readOnly
            className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none cursor-default"
          />
          {!phoneVerified && phone && (
            <ButtonLink
              onClick={() => navigate({phoneVerifyLink})}
              className="mt-1 text-sm"
            >
              Verifikasi nomor
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
