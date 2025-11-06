import React, { useEffect, useRef, useState } from "react";
import TemplatePin from "../ui/TemplatePin";

export default function CenteredNumberInputPad({
  value,
  onChange,
  onConfirm,                 // (pin) => void
  title = "Masukkan PIN Anda",
  length = 6,
  loading = false,
  errorText = "",
  zIndex = 10050,
  onClearError,             // () => void
  attemptKey,               // number
  // ← tambahan untuk kontrol Back & Forgot di halaman pemakai
  onBack,                   // () => void (optional)
  onForgot,                 // () => void (optional, kirim di Login saja)
}) {
  const max = Math.max(4, Math.min(8, length));

  const [shaking, setShaking] = useState(false);
  const [suppressErrorUI, setSuppressErrorUI] = useState(false);
  const hiddenRef = useRef(null);
  const prevLoadingRef = useRef(loading);
  const shakeTimeoutRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => hiddenRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const triggerShake = () => {
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    setShaking(false);
    const start = setTimeout(() => setShaking(true), 10);
    shakeTimeoutRef.current = setTimeout(() => setShaking(false), 510);
    return () => { clearTimeout(start); clearTimeout(shakeTimeoutRef.current); };
  };

  useEffect(() => {
    if (!attemptKey) return;
    if (errorText) { setSuppressErrorUI(false); triggerShake(); }
  }, [attemptKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!errorText) return;
    setSuppressErrorUI(false);
    triggerShake();
  }, [errorText]);

  useEffect(() => {
    const was = prevLoadingRef.current;
    if (was && !loading && !!errorText) { setSuppressErrorUI(false); triggerShake(); }
    prevLoadingRef.current = loading;
  }, [loading, errorText]);

  useEffect(() => {
    if (value.length === 0) setSuppressErrorUI(true);
  }, [value]);

  const clamp = (s) => (s || "").toString().replace(/\D/g, "").slice(0, max);

  const handleDigit = (d) => {
    if (loading || value.length >= max) return;
    onChange(clamp(value + d));
  };

  const handleDelete = () => {
    if (loading || value.length === 0) return;
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    onChange("");
    setShaking(false);
    setSuppressErrorUI(true);
    onClearError?.();
    hiddenRef.current?.focus();
  };

  const onHiddenChange = (e) => {
    if (loading) return;
    onChange(clamp(e.target.value));
  };
  const onHiddenKeyDown = (e) => {
    if (loading) return;
    if (/^\d$/.test(e.key) && value.length < max) {
      e.preventDefault();
      onChange(clamp(value + e.key));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      onChange(value.slice(0, -1));
    } else if (e.key === "Enter" && value.length === max) {
      e.preventDefault();
      onConfirm?.(value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onBack?.();
    }
  };

  const canConfirm = !loading && value.length === max;
  const canDelete  = !loading && value.length > 0;
  const showError  = !!errorText && !suppressErrorUI;

  return (
    <TemplatePin
      title={title}
      dots={{ length: max, filled: value.length, danger: showError, shaking }}
      onBack={onBack}                 // ← dikirim apa adanya; jika undefined, tombol back tidak muncul
      onForgot={onForgot}             // ← kirim hanya di Login; di Register jangan kirim
      onDigit={handleDigit}
      onConfirm={() => { if (canConfirm) onConfirm?.(value); }}
      onDelete={handleDelete}
      canConfirm={canConfirm}
      canDelete={canDelete}
      errorText={showError ? errorText : ""}
      zIndex={zIndex}
      enableKeyboard
      hiddenRef={hiddenRef}
      hiddenValue={value}
      onHiddenChange={onHiddenChange}
      onHiddenKeyDown={onHiddenKeyDown}
      autoFocusHidden
    />
  );
}
