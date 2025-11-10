// InputPin.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import TemplatePin from "../ui/TemplatePin";

export default function InputPin({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = "",
  length = 6,
  zIndex = 10050,
}) {
  if (!open) return null;

  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);
  const [suppressErrorUI, setSuppressErrorUI] = useState(false); // hide error visuals sampai ada attempt fail lagi
  const inputRef = useRef(null);
  const max = useMemo(() => Math.max(4, Math.min(8, length)), [length]);
  const shakeTimeoutRef = useRef(null);
  const prevLoadingRef = useRef(loading); // <<— track transisi loading

  // Fokus hidden input saat komponen muncul
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Helper: trigger shake aman (selalu reset dulu)
  const triggerShake = () => {
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    setShaking(false);
    const start = setTimeout(() => setShaking(true), 10);
    shakeTimeoutRef.current = setTimeout(() => setShaking(false), 510);
    return () => {
      clearTimeout(start);
      clearTimeout(shakeTimeoutRef.current);
    };
  };

  // 1) Tetap dukung case: error berubah → shake
  useEffect(() => {
    if (!error) return;
    setSuppressErrorUI(false);
    triggerShake();
  }, [error]);

  // 2) **PENTING**: attempt selesai (loading true→false) + error truthy → paksa tampilkan error & shake,
  //    walaupun string error-nya sama seperti sebelumnya.
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !loading && !!error) {
      setSuppressErrorUI(false); // munculkan border merah & errorText lagi
      triggerShake();            // retrigger animasi
    }
    prevLoadingRef.current = loading;
  }, [loading, error]);

  // ESC untuk keluar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Kalau user menghapus sampai kosong (backspace), sembunyikan error UI juga
  useEffect(() => {
    if (pin.length === 0) setSuppressErrorUI(true);
  }, [pin]);

  const clampNum = (raw) => (raw || "").toString().replace(/\D/g, "").slice(0, max);

  // Hidden input (buat ketik/paste)
  const handleHiddenChange = (e) => setPin(clampNum(e.target.value));
  const handleHiddenKeyDown = (e) => {
    if (loading) return;
    if (/^\d$/.test(e.key) && pin.length < max) {
      e.preventDefault();
      setPin((p) => (p + e.key).slice(0, max));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setPin((p) => p.slice(0, -1));
    } else if (e.key === "Enter" && pin.length === max) {
      e.preventDefault();
      submit();
    }
  };

  // Aksi keypad
  const onDigit = (d) => {
    if (loading || pin.length >= max) return;
    setPin((p) => (p + d).slice(0, max));
  };

  // Delete: reset ke keadaan awal (tanpa shake & tanpa error UI)
  const onDelete = () => {
    if (loading || pin.length === 0) return;
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    setPin("");
    setShaking(false);
    setSuppressErrorUI(true);   // kunci: hide border merah + error text
    inputRef.current?.focus();
  };

  const submit = async () => {
    if (loading || pin.length < max) return;
    await onSubmit?.(pin);
    // Parent bebas set error (meski string-nya sama).
    // Begitu loading turun ke false & error truthy,
    // effect [loading, error] di atas yang bakal nge-shake + tampilin border merah lagi.
  };

  const showError = !!error && !suppressErrorUI;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={pin}
        onChange={handleHiddenChange}
        onKeyDown={handleHiddenKeyDown}
        className="w-px h-px opacity-0 absolute pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      />

      <TemplatePin
        title="Enter your PIN"
        dots={{
          length: max,
          filled: pin.length,
          // merah hanya saat error aktif & tidak di-suppress
          danger: showError,
          shaking,
        }}
        onBack={onClose}
        onForgot={() => {}}
        onDigit={onDigit}
        onConfirm={submit}
        onDelete={onDelete}
        canConfirm={!loading && pin.length === max}
        canDelete={!loading && pin.length > 0}
        errorText={showError ? error : ""}
        zIndex={zIndex}
      />
    </>
  );
}
