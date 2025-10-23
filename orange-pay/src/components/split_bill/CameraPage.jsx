"use client";
import { useEffect, useRef, useState } from "react";
import NextStep from "./NextStep";

export default function CameraPage() {
  const videoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facing, setFacing] = useState("environment");
  const [errMsg, setErrMsg] = useState("");

  // ★ Baru: helper untuk mematikan kamera secara tuntas
  const stopCamera = (message) => {
    const el = videoRef.current;
    if (!el) {
      if (message) setErrMsg(message);
      setStreaming(false);
      return;
    }
    const stream = el.srcObject;
    if (stream && typeof stream.getTracks === "function") {
      stream.getTracks().forEach((t) => t.stop());
    }
    try {
      el.pause && el.pause();
    } catch {}
    el.srcObject = null; // penting untuk benar2 lepas dari DOM
    setStreaming(false);
    if (message) setErrMsg(message);
  };

  const startCamera = async (mode = facing) => {
    setErrMsg("");
    try {
      // ★ Pastikan stream lama dimatikan dulu
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          aspectRatio: { ideal: 9 / 16 },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setStreaming(true);
      }
    } catch (err) {
      setStreaming(false);
      setErrMsg("Tidak bisa mengakses kamera. Cek izin kamera & reload.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // ★ Cleanup saat komponen dilepas
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFacing = async () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    await startCamera(next);
  };

  // Capture: crop ke 9:16 (match preview)
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const srcAspect = srcW / srcH;
    const targetAspect = 9 / 16;

    let sx = 0, sy = 0, sWidth = srcW, sHeight = srcH;
    if (srcAspect > targetAspect) {
      sWidth = Math.round(srcH * targetAspect);
      sx = Math.round((srcW - sWidth) / 2);
    } else if (srcAspect < targetAspect) {
      sHeight = Math.round(srcW / targetAspect);
      sy = Math.round((srcH - sHeight) / 2);
    }

    const outH = sHeight;
    const outW = Math.round(outH * targetAspect);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ambil frame dulu...
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
    const imageData = canvas.toDataURL("image/png");

    // ★ ...baru matikan kamera supaya LED/lampu webcam benar2 off
    stopCamera("Kamera dimatikan setelah capture.");

    // lanjut ke NextStep
    setCapturedImage(imageData);
  };

  if (capturedImage) {
    return <NextStep image={capturedImage} />;
  }

  return (
    <div className="w-full flex flex-col text-white">
      {/* TOMBOL CLOSE */}
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <button
            aria-label="Close"
            title="Tutup"
            className="w-14 h-14 rounded-full flex items-center justify-center
               bg-[#3A4148] active:scale-95 transition"
            // Opsional: matikan kamera juga saat close (tidak wajib)
            onClick={() => stopCamera("Kamera dimatikan.")}
          >
            {/* Ikon X putih */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* TOMBOL HELP */}
          <button
            aria-label="Help"
            title="Bantuan"
            className="w-14 h-14 rounded-full flex items-center justify-center
               bg-[#3A4148] active:scale-95 transition"
          >
            {/* Ikon tanda tanya putih */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 18h.01M12 14a4 4 0 10-4-4"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Kamera (preview 9:16) */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!streaming && (
            <div className="absolute bottom-2 left-2 right-2 text-xs opacity-90">
              <span>{errMsg || "Menyiapkan kamera..."}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar seperti gambar (di luar kamera) */}
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          {/* KIRI: GALERI */}
          <button
            aria-label="Open gallery"
            className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ backgroundColor: "#3A4148" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" strokeWidth="2" />
              <path d="M8 13l2.5-3 3.5 5 2-2 3 4H6l2-4z" fill="white" />
              <circle cx="9" cy="9" r="1.6" fill="white" />
            </svg>
          </button>

          {/* TENGAH: CAPTURE double ring hitam */}
          <button
            onClick={handleCapture}
            disabled={!streaming}
            aria-label="Capture"
            className="relative active:scale-95 transition disabled:opacity-50"
            style={{ width: 92, height: 92 }}
            title={streaming ? "Ambil foto" : "Kamera tidak aktif"}
          >
            {/* outer ring */}
            <div
              className="rounded-full"
              style={{
                width: 92,
                height: 92,
                border: "6px solid #000",
              }}
            />
            {/* inner ring */}
            <div
              className="rounded-full absolute inset-0 m-[13px]"
              style={{
                border: "5px solid #000",
              }}
            />
            {/* white core */}
            <div
              className="rounded-full absolute inset-0 m-[22px]"
              style={{
                background: "#fff",
              }}
            />
          </button>

          {/* KANAN: FLASH */}
          <button
            aria-label="Flash"
            className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ backgroundColor: "#3A4148" }}
            title="Flash (simulasi)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
