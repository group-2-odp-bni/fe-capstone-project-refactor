import { useMemo } from "react";

export default function useTemplatePointers() {
  const pointers = useMemo(
    () => [
      {
        id: 1,
        title: "Top up super cepat",
        desc: "Dukung semua metode pembayaran populer.",
      },
      {
        id: 2,
        title: "Transfer aman",
        desc: "Enkripsi end-to-end + proteksi OTP.",
      },
      {
        id: 3,
        title: "Rewards & promo",
        desc: "Voucher harian dan cashback partner.",
      },
    ],
    []
  );

  return { pointers };
}
