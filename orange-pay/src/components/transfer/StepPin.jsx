// src/components/transfer/StepPin.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import useTransferApi from "../../hooks/api/useTransfer";
import { useNavigate } from "react-router-dom";
import TemplatePin from "../ui/TemplatePin";

export default function StepPin() {
  // ----- hooks first -----
  const { data, setStep, reset } = useTransfer();
  const { executeTransfer } = useTransferApi();
  const navigate = useNavigate();

  // ----- state -----
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");       // string kosong = tidak ada error
  const [loading, setLoading] = useState(false);

  // UI ala InputPin.jsx
  const [suppressErrorUI, setSuppressErrorUI] = useState(false);
  const [shaking, setShaking] = useState(false);
  const shakeTimeoutRef = useRef(null);
  const prevLoadingRef = useRef(loading);

  // Hidden input (hosted di TemplatePin)
  const hiddenRef = useRef(null);

  // ----- guard data -----
  useEffect(() => {
    if (!data || !data.phone || !data.amount || !data.transactionId) {
      navigate("/app/transfer", { replace: true });
    }
  }, [data, navigate]);

  // ----- helpers -----
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

  // Error berubah → tampilkan & shake
  useEffect(() => {
    if (!error) return;
    setSuppressErrorUI(false);
    triggerShake();
  }, [error]);

  // Attempt selesai (loading true → false) + error ada → paksa tampil & shake
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !loading && !!error) {
      setSuppressErrorUI(false);
      triggerShake();
    }
    prevLoadingRef.current = loading;
  }, [loading, error]);

  // Jika pin kosong (clear/backspace), sembunyikan error UI (balik normal/oranye)
  useEffect(() => {
    if (pin.length === 0) setSuppressErrorUI(true);
  }, [pin]);

  const clampNum = (raw) => (raw || "").toString().replace(/\D/g, "").slice(0, 6);

  // keyboard/paste handlers (hidden input)
  const onHiddenChange = (e) => {
    if (loading) return;
    setPin(clampNum(e.target.value));
  };

  const onHiddenKeyDown = (e) => {
    if (loading) return;
    if (/^\d$/.test(e.key) && pin.length < 6) {
      e.preventDefault();
      setPin((p) => (p + e.key).slice(0, 6));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setPin((p) => p.slice(0, -1));
    } else if (e.key === "Enter" && pin.length === 6) {
      e.preventDefault();
      submitPinAndTransfer();
    }
  };

  // keypad actions (TemplatePin)
  const onDigit = (d) => {
    if (loading || pin.length >= 6) return;
    setPin((p) => (p + d).slice(0, 6));
  };

  const onDelete = () => {
    if (loading || pin.length === 0) return;
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    setPin("");
    setShaking(false);
    setSuppressErrorUI(true); // sembunyikan merah + pesan
    hiddenRef.current?.focus();
  };

  const onBack = () => {
    if (loading) return;
    setStep("confirm");
    navigate("/app/transfer");
  };

  const setErrorAndShake = (msg) => {
    setError(msg);
    setSuppressErrorUI(false);
    triggerShake();
  };

  const submitPinAndTransfer = async () => {
    if (pin.length !== 6) {
      setErrorAndShake("PIN must be 6 digits");
      return;
    }
    if (!data || !data.phone || !data.amount) {
      setErrorAndShake("Recipient or amount missing");
      return;
    }

    if (!data.transactionId) {
      setError("Missing transaction ID");
      return;
    }

    setLoading(true);
    try {
      // ✅ pass transactionId to execute endpoint
      const res = await executeTransfer({ transactionId: data.transactionId, pin });
      console.log("StepPin: performTransfer result:", res);

      if (!res) {
        setError("Unknown error from server");
        return;
      }
      if (res.status === "error") {
        setError(res.message || "Transfer failed");
        return;
      }

      // Prefer transactionId returned, fallback to initiated one
      const tx =
        res.transactionId ||
        res.transaction_id ||
        res.id ||
        data.transactionId;

      console.log("StepPin: navigating to success tx=", tx);
      navigate(`/app/transfer/success?tx=${encodeURIComponent(tx)}`, { replace: false });
    } catch (err) {
      console.error("submitPinAndTransfer error:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      setError(apiMsg || "Transfer error");
    } finally {
      setLoading(false); // efek transisi loading akan retrigger shake bila error masih ada
    }
  };

  const showError = !!error && !suppressErrorUI;

  return (
    <TemplatePin
      title="Enter your PIN"
      dots={{
        length: 6,
        filled: pin.length,
        danger: showError,      // merah hanya saat error aktif & tidak disuppress
        shaking,
      }}
      onBack={onBack}
      onForgot={() => {}}
      onDigit={onDigit}
      onConfirm={submitPinAndTransfer}
      onDelete={onDelete}
      canConfirm={!loading && pin.length === 6}
      canDelete={!loading && pin.length > 0}
      errorText={showError ? error : ""}
      zIndex={10050}

      /* keyboard hosting by TemplatePin */
      enableKeyboard
      hiddenRef={hiddenRef}
      hiddenValue={pin}
      onHiddenChange={onHiddenChange}
      onHiddenKeyDown={onHiddenKeyDown}
      autoFocusHidden
    />
  );
}
