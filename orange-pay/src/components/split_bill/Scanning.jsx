"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useOCRImage } from "../../hooks/api/useOCRImage";
import ReceiptResultPage from "./ReceiptResult";

export default function Scanning({
  image,
  onDone,
  onRetake,
  durationMs = 5000,
}) {
  const [showResult, setShowResult] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const frameRef = useRef(null);
  const mountRef = useRef(null);
  const rafRef = useRef(null);

  const [progressPct, setProgressPct] = useState(0);
  const prevPctRef = useRef(0);

  const progressRef = useRef(0);
  const targetRef = useRef(0);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const resultRef = useRef(null);

  const [imageDimensions, setImageDimensions] = useState({
    width: 1,
    height: 1,
  });
  const [imageLoaded, setImageLoaded] = useState(false);

  const { processOCRAsync, ocrProgress, ocrData, isSuccess, isError } =
    useOCRImage();

  const apiProgressRef = useRef(0);
  const apiDoneRef = useRef(false);
  const apiErrorRef = useRef(null);

  useEffect(() => {
    apiProgressRef.current = Math.max(0, Math.min(1, (ocrProgress || 0) / 100));
  }, [ocrProgress]);

  useEffect(() => {
    apiDoneRef.current = !!isSuccess || ocrProgress >= 100;
  }, [isSuccess, ocrProgress]);

  useEffect(() => {
    apiErrorRef.current = isError
      ? ocrData?.error || new Error("OCR failed")
      : null;
  }, [isError, ocrData]);

  useEffect(() => {
    resultRef.current = ocrData;
  }, [ocrData]);

  const [isMobile, setIsMobile] = useState(false);
  const [pixelRatio, setPixelRatio] = useState(1);

  useEffect(() => {
    const check = () => {
      const mobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      setIsMobile(mobile);
      setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageDimensions({ width: 9, height: 16 });
      setImageLoaded(true);
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    if (imageLoaded && image) {
      apiProgressRef.current = 0;
      apiDoneRef.current = false;
      apiErrorRef.current = null;
      resultRef.current = null;
      processOCRAsync(image).catch(() => {});
    }
  }, [imageLoaded, image, processOCRAsync]);

  const containerAspectRatio = useMemo(() => {
    return imageDimensions.width / imageDimensions.height;
  }, [imageDimensions]);

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const getStatusText = (progress) => {
    if (progress < 30) return "Membaca struk…";
    if (progress < 70) return "Menganalisis…";
    if (progress < 100) return "Menyelesaikan…";
    return "Selesai!";
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !imageLoaded) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: isMobile ? "low-power" : "high-performance",
      preserveDrawingBuffer: false,
      stencil: false,
      depth: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(pixelRatio);
    if ("outputColorSpace" in renderer)
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

    const uniforms = {
      uTexture: { value: null },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageSize: { value: new THREE.Vector2(1, 1) },
      uTexel: { value: new THREE.Vector2(1, 1) },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uProgress;
      uniform vec2 uResolution;
      uniform vec2 uImageSize;
      uniform vec2 uTexel;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }

      float sobel(vec2 uv){
        vec2 t = uTexel;
        float tl=luma(texture2D(uTexture, uv+vec2(-t.x,-t.y)).rgb);
        float l =luma(texture2D(uTexture, uv+vec2(-t.x, 0.0)).rgb);
        float bl=luma(texture2D(uTexture, uv+vec2(-t.x, t.y)).rgb);
        float t0=luma(texture2D(uTexture, uv+vec2( 0.0,-t.y)).rgb);
        float c0=luma(texture2D(uTexture, uv).rgb);
        float b0=luma(texture2D(uTexture, uv+vec2( 0.0, t.y)).rgb);
        float tr=luma(texture2D(uTexture, uv+vec2( t.x,-t.y)).rgb);
        float r =luma(texture2D(uTexture, uv+vec2( t.x, 0.0)).rgb);
        float br=luma(texture2D(uTexture, uv+vec2( t.x, t.y)).rgb);
        float gx=-tl-2.0*l-bl+tr+2.0*r+br;
        float gy=-tl-2.0*t0-tr+bl+2.0*b0+br;
        return length(vec2(gx, gy));
      }

      vec3 rgbShift(vec2 uv, float dist){
        float amp=0.002*exp(-abs(dist)*18.0);
        vec2 off=vec2(amp,0.0);
        float r=texture2D(uTexture, uv+off).r;
        float g=texture2D(uTexture, uv).g;
        float b=texture2D(uTexture, uv-off).b;
        return vec3(r,g,b);
      }

      float detectText(vec2 uv){
        float e=sobel(uv);
        float l=luma(texture2D(uTexture, uv).rgb);
        float edgeStrength=smoothstep(0.15,0.35,e);
        float textLuma=smoothstep(0.2,0.8,l)*smoothstep(0.8,0.2,l);
        return edgeStrength*(0.7+textLuma*0.3);
      }

      void main(){
        vec2 uv=vUv;
        if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){ gl_FragColor=vec4(0.0); return; }

        float prog=clamp(uProgress,0.0,1.0);
        float y=vUv.y;

        float thickness=0.045;
        float core=smoothstep(prog-thickness,prog,y)-smoothstep(prog,prog+thickness,y);
        float glow=exp(-abs(y-prog)*25.0);
        float halo=exp(-abs(y-prog)*8.0)*0.3;

        vec3 base=rgbShift(uv, y-prog);
        vec3 color=base;

        float n=hash(uv*(uImageSize+uTime*8.0))-0.5;
        float scannedMask=step(y, prog);

        float textDetected=detectText(uv);
        float isTextArea=textDetected*scannedMask;

        vec3 boost=color*1.05+vec3(0.05,0.03,0.02);
        color=mix(color, boost, scannedMask*0.4);

        float gridX=0.02*sin((uv.x*uImageSize.x+uTime*35.0)*0.015);
        float gridY=0.02*sin((uv.y*uImageSize.y+uTime*35.0)*0.015);
        float grid=(gridX+gridY)*0.08;
        color+=grid*scannedMask*0.12;

        float e=sobel(uv);
        float edge=smoothstep(0.12,0.28,e);

        vec3 textHighlight=vec3(1.0);
        float textOverlay=isTextArea*0.25;
        color=mix(color, textHighlight, textOverlay);

        float edgeBoost=edge*(0.08*scannedMask+0.5*core+0.2*halo);
        edgeBoost+=edge*isTextArea*0.3;
        color+=vec3(edgeBoost);

        vec3 scanColor=vec3(1.0,0.604,0.145);
        color+=scanColor*(core*0.8+glow*0.22+halo*0.85);
        color+=n*(core+glow)*0.1;

        float dist=distance(vUv, vec2(0.5));
        float vignette=smoothstep(0.98,0.4,dist);
        color*=vignette*0.06+0.97;

        gl_FragColor=vec4(color,1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const placeholder = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1,
      1
    );
    if ("colorSpace" in placeholder)
      placeholder.colorSpace = THREE.SRGBColorSpace;
    else placeholder.encoding = THREE.sRGBEncoding;
    placeholder.needsUpdate = true;
    uniforms.uTexture.value = placeholder;

    const loader = new THREE.TextureLoader();
    loader.load(
      image,
      (tex) => {
        if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
        else tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = isMobile
          ? 1
          : Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        uniforms.uTexture.value = tex;
        const { width, height } = tex.image;
        uniforms.uImageSize.value.set(width, height);
        uniforms.uTexel.value.set(1 / width, 1 / height);
      },
      undefined,
      () => console.warn("Texture load failed")
    );

    const resize = () => {
      const parent = frameRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(frameRef.current);
    resize();
    window.addEventListener("orientationchange", resize);

    const start = performance.now();
    const DURATION = Math.max(1200, durationMs);

    const MAX_SPEED_PER_SEC = 0.9;
    const MIN_STEP = 0.002;

    const animate = (now) => {
      const elapsed = now - start;
      const fallback = Math.min(elapsed / DURATION, 1);
      const apiTarget = apiProgressRef.current;
      const target = apiTarget > 0 ? apiTarget : fallback;
      targetRef.current = target;

      const last = progressRef.current;
      const dt = (animate._lastTs ? now - animate._lastTs : 16.6) / 1000;
      animate._lastTs = now;
      const diff = target - last;
      const maxStep = Math.max(MIN_STEP, MAX_SPEED_PER_SEC * dt || MIN_STEP);
      const step = Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
      const next = Math.min(1, Math.max(0, last + step));
      progressRef.current = next;

      uniforms.uProgress.value = easeInOutCubic(next);
      uniforms.uTime.value = now * 0.001;

      const pct = Math.round(next * 100);
      if (pct !== prevPctRef.current) {
        prevPctRef.current = pct;
        setProgressPct(pct);
      }

      renderer.render(scene, camera);

      const animDone = next >= 0.995;
      const apiDone = apiDoneRef.current || apiTarget >= 0.995;

      if (animDone && apiDone) {
        if (!animate._called) {
          animate._called = true;
          const payload = apiErrorRef.current
            ? {
                error: true,
                message: apiErrorRef.current?.message || "OCR error",
              }
            : resultRef.current || { success: true };

          // ✅ FIXED: Add imageUrl to receiptData
          setTimeout(() => {
            if (payload.success && payload.items) {
              setReceiptData({
                ...payload,
                imageUrl: image, // ✅ CRITICAL FIX
              });
              setShowResult(true);
            } else {
              onDoneRef.current?.(payload);
            }
          }, 300);
        }
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
      try {
        container.removeChild(renderer.domElement);
      } catch {}
      renderer.dispose();
      quad.geometry.dispose();
      material.dispose();
      if (uniforms.uTexture.value && uniforms.uTexture.value !== placeholder) {
        uniforms.uTexture.value.dispose();
      }
      placeholder.dispose();
    };
  }, [image, imageLoaded, isMobile, pixelRatio, durationMs]);

  // ===== RESULT PAGE HANDLERS =====
  const handleResultBack = () => {
    setShowResult(false);
    if (onRetake) onRetake();
  };

  const handleResultConfirm = (data) => {
    if (onDone) {
      onDone({
        ...receiptData,
        selectedItems: data.selectedItems,
        calculatedSubtotal: data.calculatedSubtotal,
        finalTotal: data.finalTotal,
      });
    }
  };

  if (showResult && receiptData) {
    return (
      <ReceiptResultPage
        receiptData={receiptData}
        onBack={handleResultBack}
        onConfirm={handleResultConfirm}
      />
    );
  }

  if (!imageLoaded) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-black min-h-screen bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF9A25]/10 to-[#FFCE52]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#FF9A25]/8 to-[#FFB452]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 border-4 border-[#FF9A25] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-800 text-sm font-semibold">
            Memuat gambar...
          </p>
        </div>
      </div>
    );
  }

  // ===== SCANNING UI =====
  return (
    <div className="w-full flex flex-col items-center justify-between text-black min-h-screen">
      <div className="w-full flex items-center justify-center mt-4 sm:mt-8 px-4 sm:px-6 flex-1">
        <div
          ref={frameRef}
          className="w-full max-w-[min(100vw-32px,420px)] sm:max-w-sm rounded-xl sm:rounded-2xl overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.4)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          style={{
            aspectRatio: containerAspectRatio.toFixed(4),
            background:
              "radial-gradient(120% 140% at 50% -10%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)",
          }}
        >
          <img
            src={image}
            alt="Hasil tangkapan"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
            draggable={false}
            loading="eager"
          />
          <div ref={mountRef} className="absolute inset-0 z-10 w-full h-full" />
          <OverlayOCRBlocks progress01={progressRef.current} />
          <CornerFX progress01={progressRef.current} />
          <div
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.22) 100%)",
            }}
          />
        </div>
      </div>

      <div className="w-full pb-[max(24px,calc(env(safe-area-inset-bottom)+16px))] px-4 sm:px-6 relative z-10">
        <div className="mt-6 max-w-sm mx-auto text-center">
          <p className="text-base sm:text-lg font-bold text-gray-800 mb-3">
            {getStatusText(progressPct)}
          </p>

          <div className="relative w-full h-3 sm:h-4 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200 shadow-inner">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FF9A25] via-[#FFB347] to-[#FF9A25] shadow-lg shadow-[#FF9A25]/30 rounded-full transition-[width] duration-100 ease-out will-change-[width]"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0.05) 100%)",
              }}
            />
          </div>

          <p className="mt-2 text-gray-600 text-xs sm:text-sm font-semibold tabular-nums">
            {progressPct}%
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ocr-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes corner-shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

function OverlayOCRBlocks({ progress01 }) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div
        className="absolute left-0 w-full"
        style={{
          top: `calc(${progress01 * 100}% - 1.5px)`,
          height: "3px",
          background:
            "linear-gradient(90deg, rgba(255,154,37,0) 0%, rgba(255,154,37,0.95) 20%, rgba(255,154,37,1) 50%, rgba(255,154,37,0.95) 80%, rgba(255,154,37,0) 100%)",
          filter:
            "drop-shadow(0 0 10px rgba(255,154,37,0.7)) drop-shadow(0 0 20px rgba(255,154,37,0.4))",
          opacity: 0.95,
        }}
      />

      <div
        className="absolute left-0 w-full"
        style={{
          top: `calc(${progress01 * 100}% - 12px)`,
          height: "24px",
          background:
            "radial-gradient(ellipse 100% 50% at 50% 50%, rgba(255,154,37,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function CornerFX({ progress01 }) {
  const ease = (x) => Math.max(0, Math.min(1, x));
  const gaussian = (d, k = 8) => Math.exp(-d * k);
  const topIntensity = ease(gaussian(progress01, 8));
  const bottomIntensity = ease(gaussian(1 - progress01, 8));

  const isSmall = typeof window !== "undefined" && window.innerWidth < 640;
  const LEN = isSmall ? 36 : 44;
  const THICK = isSmall ? 2.5 : 3;
  const PAD = isSmall ? 8 : 10;
  const BASE_OP = 0.35;

  const accent = (op = 1) => `rgba(255,154,37,${op})`;
  const gradH = `linear-gradient(90deg, ${accent(0)} 0%, ${accent(
    0.9
  )} 25%, ${accent(1)} 50%, ${accent(0.9)} 75%, ${accent(0)} 100%)`;
  const gradV = `linear-gradient(180deg, ${accent(0)} 0%, ${accent(
    0.9
  )} 25%, ${accent(1)} 50%, ${accent(0.9)} 75%, ${accent(0)} 100%)`;

  const cornerStyle = (intensity) => ({
    opacity: BASE_OP + 0.65 * intensity,
    filter: `drop-shadow(0 0 ${10 + 12 * intensity}px ${accent(0.65)})`,
    transition: "opacity 150ms ease-out, filter 150ms ease-out",
  });

  const BarH = ({ style }) => (
    <span
      className="absolute rounded-full"
      style={{
        ...style,
        height: THICK,
        width: LEN,
        backgroundImage: gradH,
        backgroundSize: "200% 100%",
        animation: "corner-shimmer 2000ms ease-in-out infinite",
      }}
    />
  );
  const BarV = ({ style }) => (
    <span
      className="absolute rounded-full"
      style={{
        ...style,
        width: THICK,
        height: LEN,
        backgroundImage: gradV,
        backgroundSize: "200% 100%",
        animation: "corner-shimmer 2000ms ease-in-out infinite",
      }}
    />
  );

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div
        style={{ top: PAD, left: PAD, ...cornerStyle(topIntensity) }}
        className="absolute"
      >
        <BarH style={{ left: 0, top: 0 }} />
        <BarV style={{ left: 0, top: 0 }} />
      </div>
      <div
        style={{ top: PAD, right: PAD, ...cornerStyle(topIntensity) }}
        className="absolute"
      >
        <BarH style={{ right: 0, top: 0, transform: "scaleX(-1)" }} />
        <BarV style={{ right: 0, top: 0 }} />
      </div>
      <div
        style={{ bottom: PAD, left: PAD, ...cornerStyle(bottomIntensity) }}
        className="absolute"
      >
        <BarH style={{ left: 0, bottom: 0 }} />
        <BarV style={{ left: 0, bottom: 0, transform: "scaleY(-1)" }} />
      </div>
      <div
        style={{ bottom: PAD, right: PAD, ...cornerStyle(bottomIntensity) }}
        className="absolute"
      >
        <BarH style={{ right: 0, bottom: 0, transform: "scaleX(-1)" }} />
        <BarV style={{ right: 0, bottom: 0, transform: "scaleY(-1)" }} />
      </div>
    </div>
  );
}
