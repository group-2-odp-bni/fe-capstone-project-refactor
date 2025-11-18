-----

## Dokumentasi Error Code API

Dokumen ini merinci semua `errorCode` yang distandarisasi yang dikembalikan oleh API. Tim Frontend (FE) dapat menggunakan dokumen ini untuk memetakan `errorCode` ke pesan atau tindakan spesifik di sisi klien.

### 🎯 Struktur Respons Error

Setiap respons error dari API akan mengikuti format JSON standar di bawah ini. `errorCode` adalah pengidentifikasi unik yang paling penting untuk logika penanganan di sisi FE.

```json
{
  "timestamp": "2025-11-17T07:30:00.123Z",
  "status": 404,
  "errorCode": "TXN-1001",
  "message": "Transaction not found",
  "path": "/api/v1/transactions/some-id"
}
```

  * **`status`**: Kode status HTTP (e.g., 404, 400, 500).
  * **`errorCode`**: Kode internal yang unik dan stabil. **Gunakan ini sebagai *key* untuk logika di FE.**
  * **`message`**: Pesan *default* yang dapat dibaca manusia dari backend. FE *dapat* memilih untuk menampilkan pesan ini, atau menggantinya dengan pesan kustom yang lebih ramah pengguna berdasarkan `errorCode`.

-----

## 1\. 💳 Error Transaksi (Prefix: `TXN-`)

Error yang terkait dengan proses pembuatan, pemrosesan, dan pengambilan transaksi.

### 1.1. Transaksi (1xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-1001`** | 404 NOT\_FOUND | Transaction not found | Tampilkan pesan "Transaksi tidak ditemukan". Arahkan kembali ke halaman riwayat/dashboard. |
| **`TXN-1002`** | 409 CONFLICT | Transaction has already been processed | Tampilkan pesan error (e.g., "Transaksi ini sudah diproses sebelumnya"). |
| **`TXN-1003`** | 410 GONE | Transaction has expired | Tampilkan pesan error (e.g., "Waktu untuk transaksi ini telah habis"). |
| **`TXN-1004`** | 400 BAD\_REQUEST | Transaction is in invalid state for this operation | Tampilkan pesan error. Ini mengindikasikan aksi yang tidak valid (e.g., mencoba membatalkan transaksi yang sudah selesai). |
| **`TXN-1005`** | 409 CONFLICT | Duplicate transaction detected | Tampilkan pesan error (e.g., "Transaksi ganda terdeteksi. Mohon cek riwayat Anda"). |

### 1.2. Pengguna & Penerima (2xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-2001`** | 404 NOT\_FOUND | User not found | Seharusnya tidak terjadi jika pengguna sudah login. Jika ya, paksa logout. |
| **`TXN-2002`** | 404 NOT\_FOUND | Recipient not found... | Tampilkan error pada *input field* nomor telepon (e.g., "Nomor telepon penerima tidak ditemukan"). |
| **`TXN-2003`** | 400 BAD\_REQUEST | Cannot transfer to yourself | Tampilkan error (e.g., "Anda tidak dapat mengirim uang ke diri sendiri"). |
| **`TXN-2004`** | 404 NOT\_FOUND | Recipient does not have an active wallet | Tampilkan error (e.g., "Penerima tidak memiliki dompet aktif"). |
| **`TXN-2005`** | 400 BAD\_REQUEST | Recipient's wallet is not active | Tampilkan error (e.g., "Dompet penerima tidak aktif"). |
| **`TXN-2006`** | 404 NOT\_FOUND | Recipient has not set a default wallet... | Tampilkan error (e.g., "Penerima belum mengatur dompet utama"). |

### 1.3. Dompet & Saldo (3xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-3001`** | 404 NOT\_FOUND | Wallet not found | Tampilkan pesan error umum. Ini mungkin kesalahan sisi server atau referensi ID yang salah. |
| **`TXN-3002`** | 409 CONFLICT | Insufficient balance... | Tampilkan pesan error yang jelas (e.g., "Saldo tidak mencukupi"). |
| **`TXN-3003`** | 400 BAD\_REQUEST | Wallet is not active | Tampilkan pesan error (e.g., "Dompet Anda tidak aktif. Silakan hubungi CS"). |
| **`TXN-3004`** | 500 ISE | Failed to adjust wallet balance | **Error Server.** Tampilkan pesan generik (e.g., "Terjadi kesalahan. Uang Anda aman. Coba lagi nanti"). |

### 1.4. PIN & Keamanan (4xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-4001`** | 401 UNAUTHORIZED | Invalid PIN provided | Tampilkan error pada input PIN (e.g., "PIN salah"). **Jangan** redirect ke login. |
| **`TXN-4002`** | 401 UNAUTHORIZED | PIN verification failed | Sama seperti `TXN-4001`. Tampilkan error pada input PIN. |

### 1.5. Validasi (5xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-5000`** | 400 BAD\_REQUEST | Input validation failed | Kesalahan validasi umum. Jika memungkinkan, BE harus mengembalikan error yang lebih spesifik. |
| **`TXN-5001`** | 400 BAD\_REQUEST | Invalid transaction amount | Tampilkan error pada *input field* jumlah (e.g., "Jumlah tidak valid"). |
| **`TXN-5002`** | 400 BAD\_REQUEST | Invalid phone number format | Tampilkan error pada *input field* nomor telepon (e.g., "Format nomor telepon salah"). |
| **`TXN-5003`** | 400 BAD\_REQUEST | Invalid or unsupported currency | Tampilkan error pada pemilihan mata uang. |
| **`TXN-5004`** | 400 BAD\_REQUEST | Required field is missing | Tampilkan error pada field yang wajib diisi. |

### 1.6. Servis Eksternal (6xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-6000`** | 502 BAD\_GATEWAY | Error communicating with... | **Error Server.** Tampilkan pesan generik (e.g., "Sistem sedang sibuk. Coba lagi nanti"). |
| **`TXN-6001`** | 503 SERVICE\_UNAVAILABLE | User service is unavailable | **Error Server.** Tampilkan pesan generik (e.g., "Sistem sedang sibuk. Coba lagi nanti"). |
| **`TXN-6002`** | 503 SERVICE\_UNAVAILABLE | Wallet service is unavailable | **Error Server.** Tampilkan pesan generik (e.g., "Sistem sedang sibuk. Coba lagi nanti"). |
| **`TXN-6003`** | 503 SERVICE\_UNAVAILABLE | Authentication service is... | **Error Server.** Tampilkan pesan generik (e.g., "Sistem sedang sibuk. Coba lagi nanti"). |
| **`TXN-6004`** | 504 GATEWAY\_TIMEOUT | External service request timed out | **Error Server.** Tampilkan pesan generik (e.g., "Sistem sedang sibuk. Coba lagi nanti"). |
| **`TXN-6005`** | 500 ISE | Failed to update wallet balance | **Error Server.** Tampilkan pesan generik (e.g., "Terjadi kesalahan. Uang Anda aman. Coba lagi nanti"). |

### 1.7. Top-Up & Pembayaran (7xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-7001`** | 400 BAD\_REQUEST | Payment provider not available | Tampilkan error (e.g., "Metode pembayaran ini tidak tersedia"). |
| **`TXN-7002`** | 502 BAD\_GATEWAY | Payment provider returned an error | **Error Server.** Tampilkan pesan generik (e.g., "Gagal menghubungi penyedia pembayaran. Coba lagi"). |
| **`TXN-7003`** | 404 NOT\_FOUND | Virtual account not found | Tampilkan pesan "Virtual account tidak ditemukan". |
| **`TXN-7004`** | 410 GONE | Virtual account has expired | Tampilkan pesan "Virtual account sudah kedaluwarsa". |
| **`TXN-7005`** | 409 CONFLICT | Virtual account has already been paid | Tampilkan pesan "Tagihan ini sudah dibayar". |
| **`TXN-7006`** | 400 BAD\_REQUEST | Invalid status for this operation | Tampilkan pesan error. |
| **`TXN-7007`** | 400 BAD\_REQUEST | Invalid request | Tampilkan pesan error. |
| **`TXN-7008`** | 401 UNAUTHORIZED | Invalid webhook signature | Hanya relevan untuk server (webhook). |
| **`TXN-7009`** | 400 BAD\_REQUEST | Missing signature header | Hanya relevan untuk server (webhook). |
| **`TXN-7010`** | 500 ISE | Signature validation error | Hanya relevan untuk server (webhook). |
| **`TXN-7011`** | 400 BAD\_REQUEST | Invalid or expired timestamp | Hanya relevan untuk server (webhook). |

### 1.8. Otorisasi (8xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-8001`** | 401 UNAUTHORIZED | Unauthorized access | Token tidak valid. **Hapus session/token lokal dan redirect ke halaman login.** |
| **`TXN-8002`** | 403 FORBIDDEN | User does not have access... | Tampilkan pesan "Anda tidak memiliki izin untuk mengakses dompet ini". **Jangan** redirect ke login. |
| **`TXN-8003`** | 400 BAD\_REQUEST | Wallet is not active | Tampilkan pesan "Dompet Anda tidak aktif". |
| **`TXN-8004`** | 403 FORBIDDEN | User role does not have... | Tampilkan pesan "Anda tidak memiliki izin untuk melakukan aksi ini". |
| **`TXN-8005`** | 403 FORBIDDEN | Wallet membership is not active | Tampilkan pesan "Keanggotaan dompet Anda tidak aktif". |
| **`TXN-8006`** | 400 BAD\_REQUEST | Transaction exceeds wallet limit | Tampilkan pesan "Transaksi melebihi limit dompet". |
| **`TXN-8007`** | 400 BAD\_REQUEST | Daily transaction limit exceeded | Tampilkan pesan "Limit transaksi harian Anda telah terlampaui". |
| **`TXN-8008`** | 400 BAD\_REQUEST | Personal spending limit exceeded | Tampilkan pesan "Limit pengeluaran pribadi Anda terlampaui". |

### 1.9. Error Umum (9xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`TXN-9001`** | 500 ISE | An unexpected error occurred | **Error Server.** Tampilkan pesan generik (e.g., "Terjadi kesalahan pada sistem. Coba lagi nanti"). |
| **`TXN-9002`** | 503 SERVICE\_UNAVAILABLE | Service is temporarily unavailable | **Error Server.** Tampilkan pesan generik (e.g., "Sistem sedang sibuk. Coba lagi nanti"). |

-----

## 2\. 👤 Error Pengguna (Prefix: `USER-`)

Error yang terkait dengan manajemen profil pengguna, verifikasi, dan unggah file.

### 2.1. Profil & Duplikasi (1xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`USER-1001`** | 404 NOT\_FOUND | User profile not found | Paksa logout, karena user yang terautentikasi seharusnya memiliki profil. |
| **`USER-1002`** | 400 BAD\_REQUEST | Failed to update user profile | Tampilkan pesan error (e.g., "Gagal memperbarui profil"). |
| **`USER-1010`** | 409 CONFLICT | Email address is already in use | Tampilkan error di *input field* email (e.g., "Email sudah terdaftar"). |
| **`USER-1011`** | 409 CONFLICT | Phone number is already in use | Tampilkan error di *input field* telepon (e.g., "Nomor telepon sudah terdaftar"). |
| **`USER-1012`** | 409 CONFLICT | This email is already pending... | Tampilkan error di *input field* email (e.g., "Email ini sedang menunggu verifikasi oleh pengguna lain"). |
| **`USER-1013`** | 409 CONFLICT | This phone number is already pending... | Tampilkan error di *input field* telepon (e.g., "Nomor ini sedang menunggu verifikasi oleh pengguna lain"). |

### 2.2. OTP & Rate Limit (2xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`USER-2001`** | 400 BAD\_REQUEST | Invalid or incorrect OTP code | Tampilkan error di *input field* OTP (e.g., "Kode OTP salah"). |
| **`USER-2002`** | 400 BAD\_REQUEST | OTP code has expired | Tampilkan error (e.g., "Kode OTP kedaluwarsa") dan aktifkan tombol "Kirim Ulang". |
| **`USER-2003`** | 429 TOO\_MANY\_REQUESTS | Too many failed OTP attempts... | Tampilkan pesan error dan nonaktifkan *input* OTP untuk sementara. |
| **`USER-2004`** | 404 NOT\_FOUND | No active OTP found for verification | Tampilkan pesan "Silakan minta kode OTP baru". Aktifkan tombol "Kirim Ulang". |
| **`USER-2005`** | 400 BAD\_REQUEST | This OTP has already been verified | Tampilkan pesan "OTP sudah digunakan". |
| **`USER-2010`** | 429 TOO\_MANY\_REQUESTS | Too many requests. Please try again later | Tampilkan pesan "Terlalu banyak percobaan". Nonaktifkan tombol/aksi untuk sementara. |
| **`USER-2011`** | 429 TOO\_MANY\_REQUESTS | OTP generation limit exceeded... | Tampilkan pesan error dan nonaktifkan tombol "Kirim Ulang OTP" untuk sementara. |

### 2.3. Validasi & Verifikasi (3xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`USER-3001`** | 400 BAD\_REQUEST | Invalid email format | Tampilkan error di *input field* email (e.g., "Format email salah"). |
| **`USER-3002`** | 400 BAD\_REQUEST | Invalid phone number format | Tampilkan error di *input field* telepon (e.g., "Format nomor telepon salah"). |
| **`USER-3003`** | 400 BAD\_REQUEST | No pending verification found... | Tampilkan error (e.g., "Tidak ada permintaan verifikasi yang tertunda"). |
| **`USER-3004`** | 400 BAD\_REQUEST | New value is the same as current value | Tampilkan pesan (e.g., "Email baru sama dengan email saat ini"). |
| **`USER-3005`** | 400 BAD\_REQUEST | Verification token does not match... | Tampilkan error (e.g., "Verifikasi gagal. Silakan coba lagi"). |

### 2.4. File (4xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`USER-4001`** | 400 BAD\_REQUEST | Invalid or empty file | Tampilkan error pada *input* file (e.g., "File tidak boleh kosong"). |
| **`USER-4002`** | 400 BAD\_REQUEST | File size exceeds maximum... | Tampilkan error (e.g., "Ukuran file terlalu besar"). |
| **`USER-4003`** | 400 BAD\_REQUEST | Invalid file type | Tampilkan error (e.g., "Tipe file tidak didukung"). |
| **`USER-4004`** | 500 ISE | Failed to upload file | **Error Server.** Tampilkan pesan generik (e.g., "Gagal mengunggah file. Coba lagi"). |
| **`USER-4005`** | 404 NOT\_FOUND | File not found in storage | Tampilkan gambar/placeholder "Tidak Ditemukan". |
| **`USER-4006`** | 500 ISE | Failed to generate file URL | **Error Server.** Tampilkan pesan generik (e.g., "Gagal memuat file"). |

### 2.5. Error Umum (9xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`USER-9999`** | 500 ISE | An unexpected error occurred | **Error Server.** Tampilkan pesan generik (e.g., "Terjadi kesalahan pada sistem. Coba lagi nanti"). |

-----

## 3\. 🔒 Error Autentikasi (Prefix: `AUTH-`)

Error yang terkait dengan proses login, registrasi, PIN, dan manajemen sesi.

### 3.1. Pengguna & Umum (1xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`AUTH-1001`** | 404 NOT\_FOUND | User not found... | Tampilkan error di form login (e.g., "Nomor telepon tidak terdaftar"). |
| **`AUTH-1002`** | 409 CONFLICT | A user with this phone number... | Tampilkan error di form registrasi (e.g., "Nomor telepon sudah terdaftar"). |

### 3.2. Alur OTP (2xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`AUTH-2001`** | 429 TOO\_MANY\_REQUESTS | Please wait before requesting... | Nonaktifkan tombol "Kirim OTP" dan tampilkan *cooldown timer*. |
| **`AUTH-2002`** | 400 BAD\_REQUEST | The provided OTP is invalid... | Tampilkan error di *input field* OTP (e.g., "Kode OTP salah atau kedaluwarsa"). |
| **`AUTH-2003`** | 400 BAD\_REQUEST | Invalid or missing CAPTCHA | Tampilkan error "Verifikasi CAPTCHA gagal. Silakan coba lagi". |
| **`AUTH-2004`** | 429 TOO\_MANY\_REQUESTS | Please wait before requesting... | Nonaktifkan tombol "Reset PIN" dan tampilkan *cooldown timer*. |

### 3.3. Alur PIN & Login (3xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`AUTH-3001`** | 423 LOCKED | Account is temporarily locked... | Tampilkan pesan "Akun Anda terkunci sementara". Nonaktifkan form login. |
| **`AUTH-3002`** | 401 UNAUTHORIZED | The provided PIN is incorrect | Tampilkan error di *input field* PIN (e.g., "PIN salah"). |
| **`AUTH-3003`** | 400 BAD\_REQUEST | The current PIN provided... | Tampilkan error di *input field* PIN lama (e.g., "PIN saat ini salah"). |
| **`AUTH-3004`** | 400 BAD\_REQUEST | PIN has not been set... | Arahkan pengguna ke alur "Buat PIN" (Set PIN). |

### 3.4. Alur Token & Sesi (4xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`AUTH-4001`** | 403 FORBIDDEN | This token does not have... | Seharusnya jarang terjadi. Jika ya, bisa jadi bug. Tampilkan pesan "Aksi tidak diizinkan". |
| **`AUTH-4002`** | 401 UNAUTHORIZED | Refresh token has expired... | **Hapus session/token lokal dan redirect ke halaman login.** |
| **`AUTH-4003`** | 401 UNAUTHORIZED | Token reuse detected... | **Hapus semua session/token lokal dan paksa redirect ke halaman login.** Ini adalah insiden keamanan. |
| **`AUTH-4004`** | 403 FORBIDDEN | You are not authorized to... | Tampilkan error (e.g., "Anda tidak bisa menghapus sesi ini"). |
| **`AUTH-4005`** | 404 NOT\_FOUND | Session not found | Tampilkan error (e.g., "Sesi tidak ditemukan"). |

### 3.5. Akses & Error Umum (9xxx)

| Error Code | HTTP Status | Default Message | Rekomendasi Aksi Frontend (FE) |
| :--- | :--- | :--- | :--- |
| **`AUTH-9001`** | 403 FORBIDDEN | You do not have permission... | Tampilkan halaman/pesan "Akses Ditolak". **Jangan** redirect ke login. |
| **`AUTH-9999`** | 500 ISE | An unexpected error occurred | **Error Server.** Tampilkan pesan generik (e.g., "Terjadi kesalahan pada sistem. Coba lagi nanti"). |