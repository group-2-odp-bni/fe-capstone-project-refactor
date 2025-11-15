import React, { useEffect, useRef, useState } from "react";
import TemplatePin from "../ui/TemplatePin";

export default function CenteredNumberInputPad({
  value,
  onChange,
  onConfirm,                 // (pin)9 => void
  title,
  length = 6,
  loading = false,
  errorText = "",
  zIndex = 10050,
  onClearError,             // () => void
  attemptKey,               // number
  // kontrol Back & Forgot
  onBack,                   // () => void (optional)
  onForgot,                 // () => void (optional)
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

  // ✅ helper: reset error UI ketika user mengedit
  const clearErrorOnEdit = () => {
    setShaking(false);
    setSuppressErrorUI(true);
    onClearError?.();
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
    clearErrorOnEdit(); // ⬅️ reset merah+shake saat user mengetik
    onChange(clamp(value + d));
  };

  const handleDelete = () => {
    if (loading || value.length === 0) return;
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    clearErrorOnEdit(); // ⬅️ reset merah+shake saat user menghapus
    const next = value.slice(0, -1); // hapus 1 digit terakhir
    onChange(next);
    hiddenRef.current?.focus();
  };

  const onHiddenChange = (e) => {
    if (loading) return;
    clearErrorOnEdit(); // ⬅️ reset ketika user ketik via input tersembunyi
    onChange(clamp(e.target.value));
  };

  const onHiddenKeyDown = (e) => {
    if (loading) return;
    if (/^\d$/.test(e.key) && value.length < max) {
      e.preventDefault();
      clearErrorOnEdit(); // ⬅️ reset saat ketik digit via keyboard
      onChange(clamp(value + e.key));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      clearErrorOnEdit(); // ⬅️ reset saat backspace
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
      onBack={onBack}
      onForgot={onForgot}
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
