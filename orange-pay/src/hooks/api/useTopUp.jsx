// src/hooks/useTopUp.js
import { useRef, useState } from "react";

// RAW bisa '/api' atau 'http://localhost:4000' atau 'http://localhost:4000/api'
const RAW = import.meta.env?.VITE_API_BASE_URL || "/api";
const TRIM = RAW.replace(/\/$/, "");
const BASE_API = TRIM.endsWith("/api") ? TRIM : `${TRIM}/api`; // <- PENTING
// defaultkan dummy ke TRUE biar aman kalau backend belum ada
const USE_DUMMY = (import.meta.env?.VITE_USE_DUMMY ?? "true") === "true";

function genIdemKey() {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTopUp() {t
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const lock = useRef(false);

  async function createTopUp({ amount, methodCode = "BNI_VA" }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error("Amount tidak valid");
    }

    if (USE_DUMMY) {
      await new Promise(r => setTimeout(r, 500));
      return {
        virtualAccount: "7152635469183644",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        trxId: "DUMMY123",
        amount: Number(amount),
        method: methodCode,
      };
    }

    const res = await fetch(`${BASE_API}/topups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": genIdemKey(),
      },
      credentials: "include",
      // kalau backend kamu expect 'channel' bukan 'method', kirim dua-duanya
      body: JSON.stringify({ amount: Number(amount), method: methodCode, channel: methodCode }),
    });

    const text = await res.text();
    let data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = data?.message || data?.error || res.statusText || "Top up gagal";
      throw new Error(msg);
    }

    return {
      virtualAccount: data?.virtualAccount,
      expiresAt: data?.expiresAt,
      trxId: data?.trxId || data?.id,
      amount: Number(amount),
      method: methodCode,
    };
  }

  async function createTopUpSafe(args) {
    if (lock.current) return null;
    lock.current = true;
    setError("");
    setLoading(true);
    try {
      const r = await createTopUp(args);
      return r;
    } catch (e) {
      setError(e?.message || "Gagal membuat top up");
      return null;
    } finally {
      setLoading(false);
      lock.current = false;
    }
  }

  return { createTopUp, createTopUpSafe, loading, error };
}
