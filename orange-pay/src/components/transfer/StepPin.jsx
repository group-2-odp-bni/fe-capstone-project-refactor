// src/components/transfer/StepPin.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import useTransferApi from "../../hooks/api/useTransfer";
import { useNavigate } from "react-router-dom";
import TemplatePin from "../ui/TemplatePin";

const MAX_ATTEMPTS = 5; // ✅ Maksimal 5 kesempatan

export default function StepPin() {
  const { data, prevStep, goBack } = useTransfer();
  const { executeTransfer } = useTransferApi();
  const navigate = useNavigate();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const [suppressErrorUI, setSuppressErrorUI] = useState(false);
  const [shaking, setShaking] = useState(false);
  const shakeTimeoutRef = useRef(null);
  const prevLoadingRef = useRef(loading);
  const hiddenRef = useRef(null);

  // ----- guard data: kalau bener-bener nggak lengkap, lempar balik ke halaman transfer -----
  useEffect(() => {
    if (!data || !data.phone || !data.amount || !data.transactionId) {
      navigate("/app/transfer", { replace: true });
    }
  }, [data, navigate]);

  // ✅ kalau sudah terkunci → set error + kosongkan PIN
  useEffect(() => {
    if (isLocked) {
      setError("Akun Anda telah terblokir. Anda akan dialihkan ke halaman utama...");
      setPin("");
    }
  }, [isLocked]);

  // ✅ redirect auto setelah terkunci
  useEffect(() => {
    if (isLocked) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, navigate]);

  const triggerShake = () => {
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    setShaking(false);
    const start = setTimeout(() => setShaking(true), 10);
    shakeTimeoutRef.current = setTimeout(() => setShaking(false), 510);
    return () => {
      clearTimeout(start);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  };

  useEffect(() => {
    if (!attempt) return;
    if (error) {
      setSuppressErrorUI(false);
      triggerShake();
    }
  }, [attempt, error]);

  useEffect(() => {
    if (!error) return;
    setSuppressErrorUI(false);
    triggerShake();
  }, [error]);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !loading && !!error) {
      setSuppressErrorUI(false);
      triggerShake();
    }
    prevLoadingRef.current = loading;
  }, [loading, error]);

  useEffect(() => {
    if (pin.length === 0) {
      setSuppressErrorUI(true);
    }
  }, [pin]);

  const clampNum = (raw) =>
    (raw || "").toString().replace(/\D/g, "").slice(0, 6);

  const onHiddenChange = (e) => {
    if (loading || isLocked) return;

    if (error && e.target.value.length > pin.length) {
      setSuppressErrorUI(true);
      setError("");
    }

    setPin(clampNum(e.target.value));
  };

  const onHiddenKeyDown = (e) => {
    if (loading || isLocked) return;

    if (/^\d$/.test(e.key) && pin.length < 6) {
      e.preventDefault();

      if (error) {
        setSuppressErrorUI(true);
        setError("");
      }

      setPin((p) => (p + e.key).slice(0, 6));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      onDelete();
    } else if (e.key === "Enter" && pin.length === 6) {
      e.preventDefault();
      submitPinAndTransfer();
    }
  };

  const onDigit = (d) => {
    if (loading || isLocked || pin.length >= 6) return;

    if (error) {
      setSuppressErrorUI(true);
      setError("");
    }

    setPin((p) => (p + d).slice(0, 6));
  };

  const onDelete = () => {
    if (loading || isLocked || pin.length === 0) return;
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);

    const next = pin.slice(0, -1);
    setPin(next);

    setShaking(false);
    setSuppressErrorUI(true);
    setError("");
    hiddenRef.current?.focus();
  };

  const onBack = () => {
    if (loading) return;
    try {
      if (typeof prevStep === "function") {
        prevStep();
      } else if (typeof goBack === "function") {
        goBack();
      } else {
        navigate("/app/transfer", { replace: true });
      }
    } catch (err) {
      try {
        if (typeof goBack === "function") goBack();
        else navigate("/app/transfer", { replace: true });
      } catch (_) {}
    }
  };

  const submitPinAndTransfer = async () => {
    setAttempt((x) => x + 1);

    if (isLocked) {
      return;
    }

    if (pin.length !== 6) {
      setError("PIN must be 6 digits");
      return;
    }

    // ⚠️ Di sini kita TIDAK lagi cek !data.phone / !data.amount
    // Karena sudah dijaga oleh useEffect di atas.
    // Kalau mau ekstra aman:
    if (!data || !data.transactionId) {
      setError("Missing transaction data. Silakan ulangi transfer.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await executeTransfer({
        transactionId: data.transactionId,
        pin,
      });
      console.log("StepPin: performTransfer result:", res);

      if (!res) {
        setError("Unknown error from server");
        return;
      }

      // 👉 Di sinilah limit kesempatan dipakai kalau backend kasih status error
      if (res.status === "error") {
        setFailedAttempts((prev) => {
          const newFailed = prev + 1;
          const remaining = MAX_ATTEMPTS - newFailed;

          if (newFailed >= MAX_ATTEMPTS) {
            setIsLocked(true); // useEffect isLocked yang akan set error + redirect
          } else {
            setError(
              `${res.message || "Transfer failed"}. Anda masih punya kesempatan ${remaining} kali lagi.`
            );
          }

          return newFailed;
        });
        return;
      }

      // ✅ Success - reset counter
      setFailedAttempts(0);
      setIsLocked(false);

      const tx =
        res.transactionId ||
        res.transaction_id ||
        res.id ||
        data.transactionId;

      window.dispatchEvent(new Event("contacts:updated"));
      navigate(`/app/transfer/success?tx=${encodeURIComponent(tx)}`, {
        replace: false,
      });
    } catch (err) {
      console.error("submitPinAndTransfer error:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      // 👉 Di sini juga pakai limit kesempatan kalau API melempar error (misalnya PIN salah dilempar 4xx)
      setFailedAttempts((prev) => {
        const newFailed = prev + 1;
        const remaining = MAX_ATTEMPTS - newFailed;

        if (newFailed >= MAX_ATTEMPTS) {
          setIsLocked(true); // useEffect isLocked yang akan set error + redirect
        } else {
          setError(
            `${apiMsg || "Transfer error"}. Anda masih punya kesempatan ${remaining} kali lagi.`
          );
        }

        return newFailed;
      });
    } finally {
      setLoading(false);
    }
  };

  const showError = !!error && !suppressErrorUI;

  return (
    <TemplatePin
      title="Enter your PIN"
      dots={{
        length: 6,
        filled: pin.length,
        danger: showError,
        shaking,
      }}
      onBack={onBack}
      onForgot={() => {}}
      onDigit={onDigit}
      onConfirm={submitPinAndTransfer}
      onDelete={onDelete}
      canConfirm={!loading && !isLocked && pin.length === 6}
      canDelete={!loading && !isLocked && pin.length > 0}
      errorText={showError ? error : ""}
      zIndex={10050}
      enableKeyboard
      hiddenRef={hiddenRef}
      hiddenValue={pin}
      onHiddenChange={onHiddenChange}
      onHiddenKeyDown={onHiddenKeyDown}
      autoFocusHidden
    />
  );
}
