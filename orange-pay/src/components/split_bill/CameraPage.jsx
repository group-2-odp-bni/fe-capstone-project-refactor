"use client";
import { useEffect, useRef, useState } from "react";
import NextStep from "./NextStep";
import HelpScreen from "./HelpScreen";

export default function CameraPage({ onBack, onDone }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facing, setFacing] = useState("environment");
  const [errMsg, setErrMsg] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [flashMode, setFlashMode] = useState("off");

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
    el.srcObject = null;
    setStreaming(false);
    if (message) setErrMsg(message);
  };

  const startCamera = async (mode = facing) => {
    setErrMsg("");
    try {
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
      stopCamera();
    };
  }, []);

  const toggleFacing = async () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    await startCamera(next);
  };

  const toggleFlash = () => {
    const modes = ["off", "on", "auto"];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const srcAspect = srcW / srcH;
    const targetAspect = 9 / 16;

    let sx = 0,
      sy = 0,
      sWidth = srcW,
      sHeight = srcH;

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

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
    const imageData = canvas.toDataURL("image/png");

    stopCamera("Kamera dimatikan setelah capture.");
    setCapturedImage(imageData);
  };

  const handleOpenGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrMsg("Format file tidak didukung. Gunakan PNG atau JPG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result;
      if (typeof imageData === "string") {
        stopCamera("File dipilih dari galeri.");
        setCapturedImage(imageData);
      }
    };
    reader.onerror = () => {
      setErrMsg("Gagal membaca file. Coba lagi.");
    };
    reader.readAsDataURL(file);
  };

  const handleOpenHelp = () => {
    stopCamera();
    setShowHelp(true);
  };

  const handleCloseHelp = () => {
    setShowHelp(false);
    startCamera();
  };

  const handleClose = () => {
    stopCamera("Kamera dimatikan.");
    if (onBack) {
      onBack();
    }
  };
  const handleNextStepDone = (imageData) => {
    if (onDone) {
      onDone(imageData);
    }
  };
  const handleRetakeFromNextStep = () => {
    setCapturedImage(null);
    startCamera();
  };
  if (capturedImage) {
    return (
      <NextStep
        image={capturedImage}
        onRetake={handleRetakeFromNextStep}
        onConfirm={handleNextStepDone}
      />
    );
  }

  if (showHelp) {
    return <HelpScreen onClose={handleCloseHelp} />;
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="relative z-30 px-4 sm:px-6 pt-6 pb-4 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            aria-label="Close"
            title="Tutup"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                       bg-white border-2 border-gray-200
                       shadow-lg shadow-gray-300/30
                       hover:bg-gray-50 hover:scale-105 hover:border-gray-300
                       active:scale-95 transition-all duration-300 group"
            onClick={handleClose}
            style={{
              animation: "fadeInDown 0.6s ease-out both",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:rotate-90"
            >
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="#1F2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h1
            className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] bg-clip-text text-transparent"
            style={{
              animation: "fadeInDown 0.6s ease-out 0.1s both",
            }}
          >
            Scan Struk
          </h1>

          <button
            aria-label="Help"
            title="Bantuan"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                       bg-white border-2 border-gray-200
                       shadow-lg shadow-gray-300/30
                       hover:bg-gray-50 hover:scale-105 hover:border-gray-300
                       active:scale-95 transition-all duration-300 group"
            onClick={handleOpenHelp}
            style={{
              animation: "fadeInDown 0.6s ease-out 0.2s both",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:scale-110"
            >
              <circle cx="12" cy="12" r="9" stroke="#1F2937" strokeWidth="2" />
              <path
                d="M12 16h.01M10.5 8.5a2 2 0 113 1.5c-1 0-1.5 1-1.5 2"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div
          className="w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden relative
                     border-2 border-gray-200
                     shadow-2xl shadow-gray-400/30"
          style={{
            animation:
              "zoomIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,15 L 0,0 L 15,0"
                stroke="url(#gradient1)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 85,0 L 100,0 L 100,15"
                stroke="url(#gradient1)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 0,85 L 0,100 L 15,100"
                stroke="url(#gradient1)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 100,85 L 100,100 L 85,100"
                stroke="url(#gradient1)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />

              <defs>
                <linearGradient
                  id="gradient1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#FF9A25" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#FFCE52" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="backdrop-blur-md bg-white/90 px-4 py-2 rounded-full border border-gray-200 shadow-lg"
                style={{
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                <p className="text-gray-800 text-sm font-semibold">
                  Posisikan struk di dalam frame
                </p>
              </div>
            </div>
          </div>

          {!streaming && (
            <div className="absolute inset-0 bg-white backdrop-blur-sm flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center animate-pulse shadow-xl shadow-[#FF9A25]/30">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                      fill="white"
                    />
                    <circle cx="12" cy="13" r="4" fill="#FF9A25" />
                  </svg>
                </div>
                <p className="text-gray-800 text-sm font-medium">
                  {errMsg || "Menyiapkan kamera..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-30 px-4 sm:px-6 pb-6 pt-4 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleOpenGallery}
            aria-label="Open gallery"
            title="Buka Galeri / Pilih File"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
                       bg-white border-2 border-gray-200
                       shadow-lg shadow-gray-300/30
                       hover:bg-gray-50 hover:scale-105 hover:border-gray-300
                       active:scale-95 transition-all duration-300 group"
            style={{
              animation: "fadeInUp 0.6s ease-out 0.4s both",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:scale-110"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="#1F2937"
                strokeWidth="2"
              />
              <path
                d="M8 13l2.5-3 3.5 5 2-2 3 4H6l2-4z"
                fill="#1F2937"
                opacity="0.6"
              />
              <circle cx="9" cy="9" r="1.5" fill="#1F2937" />
            </svg>
          </button>

          <button
            onClick={handleCapture}
            disabled={!streaming}
            aria-label="Capture"
            title={streaming ? "Ambil foto" : "Kamera tidak aktif"}
            className="relative active:scale-95 transition-all duration-300 disabled:opacity-50 group"
            style={{
              width: 80,
              height: 80,
              animation:
                "fadeInUp 0.6s ease-out 0.5s both, pulse 2s ease-in-out 1s infinite",
            }}
          >
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] 
                         shadow-2xl shadow-[#FF9A25]/40 group-hover:shadow-[#FF9A25]/60
                         group-hover:scale-110 transition-all duration-300"
            />
            <div className="absolute inset-[6px] rounded-full bg-white" />
            <div className="absolute inset-[14px] rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] group-hover:scale-105 transition-all duration-300" />
            <div
              className="absolute inset-0 rounded-full bg-[#FF9A25]/20 animate-ping"
              style={{ animationDuration: "2s" }}
            />
          </button>

          <button
            aria-label="Flash"
            title={`Flash: ${flashMode}`}
            onClick={toggleFlash}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center
                       bg-white border-2 border-gray-200
                       shadow-lg shadow-gray-300/30
                       hover:bg-gray-50 hover:scale-105 hover:border-gray-300
                       active:scale-95 transition-all duration-300 group relative"
            style={{
              animation: "fadeInUp 0.6s ease-out 0.6s both",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={flashMode === "on" ? "#FF9A25" : "#1F2937"}
              className="transition-all group-hover:scale-110"
            >
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            <span className="text-[10px] text-gray-700 mt-0.5 uppercase font-bold">
              {flashMode}
            </span>
          </button>
        </div>

        <button
          onClick={toggleFacing}
          aria-label="Flip camera"
          title="Ganti kamera"
          className="absolute right-6 bottom-28 w-12 h-12 rounded-full flex items-center justify-center
                     bg-white border-2 border-gray-200
                     shadow-lg shadow-gray-300/30
                     hover:bg-gray-50 hover:scale-105 hover:rotate-180 hover:border-gray-300
                     active:scale-95 transition-all duration-500 group"
          style={{
            animation: "fadeInRight 0.6s ease-out 0.7s both",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 9L17 5v3H7a3 3 0 000 6h2M3 15l4 4v-3h10a3 3 0 000-6h-2"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
