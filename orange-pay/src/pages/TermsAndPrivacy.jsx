import React from "react";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h1 className="text-xl font-bold text-center mb-4">
          Syarat & Kebijakan Privasi
        </h1>
        <div className="prose prose-sm max-w-none text-gray-700 max-h-[60vh] overflow-y-auto pr-3 space-y-4 text-justify">
          <p>
            Selamat datang di OrangePay. Dengan mendaftar atau menggunakan
            layanan kami, Anda <strong> (Pengguna)</strong> setuju pada Syarat
            dan Ketentuan serta Kebijakan Privasi ini.
          </p>

          <h2 className="!mt-6 !mb-3 !font-bold !text-lg">
            I. Persetujuan Pengguna
          </h2>
          <p>
            Dengan melanjutkan proses ini, Anda menyatakan telah membaca,
            memahami, dan menyetujui hal-hal berikut:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Anda adalah individu yang cakap hukum (minimal 17 tahun) dan
              tunduk pada hukum Republik Indonesia.
            </li>
            <li>
              Anda setuju memberikan <strong>Nomor Telepon</strong> Anda yang
              valid untuk tujuan verifikasi pendaftaran dan otentikasi akun{" "}
              <strong>Layanan Dasar</strong>.
            </li>
            <li>
              Anda memahami bahwa untuk menggunakan fitur keuangan penuh{" "}
              <strong>Layanan Penuh</strong>, Anda akan diminta untuk memberikan
              data tambahan di dalam aplikasi, termasuk verifikasi email dan
              proses <strong>Prinsip Mengenali Pelanggan (KYC)</strong>.
            </li>
            <li>
              Anda memberikan persetujuan kepada kami untuk memproses Data
              Pribadi Anda sesuai dengan Kebijakan Privasi ini dan{" "}
              <strong>
                Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
                (UU PDP)
              </strong>
              .
            </li>
          </ol>

          <h2 className="!mt-8 !mb-3 !font-bold !text-lg">
            II. Syarat & Ketentuan
          </h2>
          <h3>1. Pendaftaran Akun (Bertahap)</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Layanan Dasar:</strong> Pendaftaran awal hanya memerlukan
              nomor telepon yang aktif untuk pengiriman Kode OTP.
            </li>
            <li>
              <strong>Layanan Penuh:</strong> Untuk mengakses fitur transfer,
              pembayaran, dan/atau batas saldo yang lebih tinggi, Anda wajib
              menyelesaikan verifikasi di dalam aplikasi.
            </li>
            <li>
              Proses verifikasi tersebut akan mencakup (namun tidak terbatas
              pada) <strong>verifikasi email</strong>
            </li>
            <li>
              Anda bertanggung jawab penuh atas keamanan akun, PIN, dan kode OTP
              Anda.
            </li>
            <li>
              Anda setuju untuk tidak menggunakan layanan untuk tujuan ilegal,
              termasuk tindak pidana{" "}
              <strong>
                Pencucian Uang dan Pencegahan Pendanaan Terorisme (APU-PPT)
              </strong>
              .
            </li>
          </ul>

          <h2 className="!mt-8 !mb-3 !font-bold !text-lg">
            III. Kebijakan Privasi (Sesuai UU PDP)
          </h2>
          <h3>1. Data Pribadi yang Kami Proses</h3>
          <p>Kami memproses Data Pribadi Anda secara bertahap:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Saat Pendaftaran Awal:</strong> Nomor Telepon Anda.
            </li>
            <li>
              <strong>Saat Verifikasi Penuh (di dalam app):</strong> Data yang
              akan Anda berikan, seperti:
              <ul className="list-circle pl-5">
                <li> -Data Identitas (nama, email, dan foto).</li>
                <li> -Data Transaksi dan Data Teknis (IP, log, perangkat).</li>
              </ul>
            </li>
          </ul>

          <h3>2. Tujuan Pemrosesan Data Pribadi</h3>
          <p>Data Anda kami proses untuk:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Memverifikasi identitas Anda saat pendaftaran (OTP) dan saat
              verifikasi penuh (KYC).
            </li>
            <li>
              Menyediakan, mengoperasikan, dan mengelola layanan OrangePay.
            </li>
            <li>Mematuhi kewajiban hukum dan regulasi yang berlaku.</li>
            <li>Mendeteksi dan mencegah fraud atau penyalahgunaan.</li>
          </ul>

          <h3>3. Hak Anda sebagai Subjek Data</h3>
          <p>
            Sesuai UU PDP, Anda berhak mengakses, memperbaiki, atau menarik
            persetujuan pemrosesan data Anda (dengan konsekuensi penutupan
            layanan) melalui pengaturan akun atau dengan menghubungi kami.
          </p>

          <p className="!pb-4">
            Dokumen ini dapat diperbarui sesuai perubahan layanan atau regulasi.
            Pertanyaan lebih lanjut dapat diajukan ke
            orange.wallet.bni@gmail.com.
          </p>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-orange-600 px-4 py-2 text-white font-semibold hover:bg-orange-700"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
