"use client";

import { useState } from "react";

export default function HelpScreen({ onClose }) {
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: 1,
      title: "Apa itu fitur Patungan ?",
      content: `Patungan adalah fitur di OrangePay yang membantu kamu membagi pembayaran dengan teman atau keluarga secara mudah. Melalui fitur ini, kamu dapat meminta teman untuk membayar bagian mereka dari suatu pembelian atau tagihan bersama.

Dengan begitu, proses berbagi biaya, pembayaran, dan tanpa perlu menghitung secara manual.`,
    },
    {
      id: 2,
      title: "Bagaimana cara kerja Patungan ?",
      content: `1. Buat permintaan patungan dengan memasukkan total biaya dan jumlah orang yang akan ikut patungan.
2. Bagikan link atau kode patungan kepada teman-teman.
3. Setiap orang membayar bagian mereka melalui OrangePay.
4. Setelah semua orang membayar, dana akan masuk ke akun pembuat patungan.`,
    },
    {
      id: 3,
      title: "Apakah ada biaya untuk menggunakan Patungan ?",
      content: `Tidak ada biaya tambahan untuk menggunakan fitur Patungan di OrangePay. Kamu dapat membuat dan mengelola patungan secara gratis.`,
    },
    {
      id: 4,
      title: "Bagaimana cara membuat Patungan ?",
      content: `1. Buka aplikasi OrangePay dan pilih menu Patungan.
2. Klik tombol 'Buat Patungan Baru'.
3. Masukkan detail seperti nama patungan, total biaya, dan jumlah peserta.
4. Bagikan link patungan kepada teman-temanmu.
5. Tunggu hingga semua peserta melakukan pembayaran.`,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative overflow-hidden">
      {/* Top bar - Responsive */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 bg-white sticky top-0 z-50">
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between">
          <button
            aria-label="Back"
            title="Kembali"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center
              bg-white shadow-lg shadow-gray-200/50 border-2 border-gray-100
              hover:shadow-xl hover:scale-105 hover:-translate-y-0.5
              active:scale-95 transition-all duration-300 ease-out group"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5">
              <path
                d="M15 6l-6 6 6 6"
                stroke="#1F2937"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] bg-clip-text text-transparent">
            Bantuan
          </h1>

          {/* spacer */}
          <div className="w-10 h-10 sm:w-11 sm:h-11" />
        </div>
      </div>

      {/* Content - Full width on mobile, max-width on desktop */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <QuestionCard
              key={faq.id}
              title={faq.title}
              content={faq.content}
              isExpanded={expandedId === faq.id}
              onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              index={index}
            />
          ))}
        </div>

        {/* Bottom padding for last item */}
        <div className="h-4 sm:h-6" />
      </div>
    </div>
  );
}

function QuestionCard({ title, content, isExpanded, onToggle, index }) {
  return (
    <div
      className="w-full"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Main Card Button - Full width, responsive padding */}
      <button
        onClick={onToggle}
        className="w-full bg-[#D9D9D9] rounded-lg sm:rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 
          flex items-center justify-between
          border-2 border-gray-100 shadow-md shadow-gray-200/50
          hover:shadow-xl hover:shadow-[#FF9A25]/10 hover:scale-[1.01] sm:hover:scale-[1.02] 
          hover:-translate-y-0.5 hover:border-gray-200
          transition-all duration-300 ease-out
          active:scale-[0.98] group relative overflow-hidden"
        aria-expanded={isExpanded}
      >
        {/* Orange gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF9A25]/0 via-[#FF9A25]/5 to-[#FF9A25]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <span className="text-sm sm:text-[15px] font-semibold text-gray-800 text-left pr-3 leading-snug relative z-10">
          {title}
        </span>

        {/* Animated Chevron - Responsive size */}
        <div
          className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] 
            flex items-center justify-center shadow-lg shadow-[#FF9A25]/30
            transition-all duration-300 ${isExpanded ? "rotate-90 scale-110" : "rotate-0 scale-100"}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="sm:w-[14px] sm:h-[14px]">
            <path
              d="M9 6l6 6-6 6"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Expanded Content - Responsive */}
      <div
        className="transition-all duration-500 ease-out overflow-hidden"
        style={{
          maxHeight: isExpanded ? "1000px" : "0px",
          marginTop: isExpanded ? "12px" : "0px",
        }}
      >
        <div
          className="bg-white rounded-lg sm:rounded-xl px-4 sm:px-6 py-5 sm:py-6 
            border-2 border-gray-100 shadow-xl shadow-gray-300/30
            backdrop-blur-sm relative overflow-hidden"
          style={{
            transform: isExpanded ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.95)",
            opacity: isExpanded ? 1 : 0,
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF9A25] to-[#FFCE52]" />
              {title}
            </h3>
            <p className="text-[13px] sm:text-[14px] leading-relaxed text-gray-600 whitespace-pre-line">
              {content}
            </p>
          </div>

          {/* Bottom orange gradient bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF9A25]/40 to-transparent" />
        </div>
      </div>

      {/* Global Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
