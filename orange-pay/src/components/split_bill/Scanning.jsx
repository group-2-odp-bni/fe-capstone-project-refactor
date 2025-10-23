"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";

export default function Scanning({ image, onDone, onRetake, durationMs = 5000 }) {
  const frameRef = useRef(null);
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const [progressPct, setProgressPct] = useState(0);
  const progressRef = useRef(0);

  // Mobile detection & DPR clamp
  const [isMobile, setIsMobile] = useState(false);
  const [pixelRatio, setPixelRatio] = useState(1);

  useEffect(() => {
    const check = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
      setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ====== DETERMINISTIC RANDOM ======
  const seeded = useMemo(() => {
    const cyrb128 = (str) => {
      let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
      for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
      }
      h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
      h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
      h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
      h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
      return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
    };
    const mulberry32 = (a) => () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return { cyrb128, mulberry32 };
  }, []);

  // ====== GENERATE OCR BLOCKS ======
  const [blocks, setBlocks] = useState([]);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const gen = () => {
      const w = el.clientWidth || 360;
      const h = el.clientHeight || 640;
      const seed = seeded.cyrb128(`${image}|${w}|${h}`);
      const rand = seeded.mulberry32(seed);

      const out = [];
      const rows = Math.floor(14 + rand() * 8);
      const minH = Math.max(12, Math.min(26, h * 0.03));
      const maxH = Math.max(minH + 2, Math.min(34, h * 0.045));

      for (let i = 0; i < rows; i++) {
        const yN = (i + 0.5) / (rows + 1);
        const jitter = (rand() - 0.5) * 0.012;
        const centerN = Math.min(0.98, Math.max(0.02, yN + jitter));
        const lineHeight = minH + rand() * (maxH - minH);

        const cols = 1 + Math.floor(rand() * 3);
        let xCursor = 0.06 + rand() * 0.04;
        for (let c = 0; c < cols; c++) {
          const remain = 0.94 - xCursor;
          if (remain < 0.2) break;
          const wN = Math.max(0.18, Math.min(remain - 0.02, (0.25 + rand() * 0.45) * remain));
          const gap = 0.02 + rand() * 0.03;
          out.push({
            x: xCursor,
            y: centerN,
            w: wN,
            h: lineHeight / h,
            delayN: rand() * 0.15,
            glow: 0.5 + rand() * 0.7,
          });
          xCursor += wN + gap;
        }
      }
      setBlocks(out);
    };

    const ro = new ResizeObserver(gen);
    ro.observe(el);
    gen();
    return () => ro.disconnect();
  }, [image, seeded]);

  // ====== THREE.JS SCENE ======
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
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

      vec2 containUv(vec2 uv, vec2 imgSize, vec2 canvasSize) {
        float imgAspect = imgSize.x / imgSize.y;
        float canvasAspect = canvasSize.x / canvasSize.y;
        vec2 ratio = vec2(1.0, 1.0);
        if (imgAspect > canvasAspect) {
          ratio.y = canvasAspect / imgAspect;
        } else {
          ratio.x = imgAspect / canvasAspect;
        }
        return (uv - 0.5) / ratio + 0.5;
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float luma(vec3 c) {
        return dot(c, vec3(0.299, 0.587, 0.114));
      }

      float sobel(vec2 uv) {
        vec2 t = uTexel;
        float tl = luma(texture2D(uTexture, uv + vec2(-t.x, -t.y)).rgb);
        float l  = luma(texture2D(uTexture, uv + vec2(-t.x,  0.0)).rgb);
        float bl = luma(texture2D(uTexture, uv + vec2(-t.x,  t.y)).rgb);
        float t0 = luma(texture2D(uTexture, uv + vec2( 0.0, -t.y)).rgb);
        float c0 = luma(texture2D(uTexture, uv).rgb);
        float b0 = luma(texture2D(uTexture, uv + vec2( 0.0,  t.y)).rgb);
        float tr = luma(texture2D(uTexture, uv + vec2( t.x, -t.y)).rgb);
        float r  = luma(texture2D(uTexture, uv + vec2( t.x,  0.0)).rgb);
        float br = luma(texture2D(uTexture, uv + vec2( t.x,  t.y)).rgb);
        float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
        float gy = -tl - 2.0*t0 - tr + bl + 2.0*b0 + br;
        return length(vec2(gx, gy));
      }

      vec3 rgbShift(vec2 uv, float dist) {
        float amp = 0.0025 * exp(-abs(dist) * 18.0);
        vec2 off = vec2(amp, 0.0);
        float r = texture2D(uTexture, uv + off).r;
        float g = texture2D(uTexture, uv).g;
        float b = texture2D(uTexture, uv - off).b;
        return vec3(r, g, b);
      }

      void main() {
        vec2 uvContain = containUv(vUv, uImageSize, uResolution);
        if (uvContain.x < 0.0 || uvContain.x > 1.0 || uvContain.y < 0.0 || uvContain.y > 1.0) {
          gl_FragColor = vec4(0.0);
          return;
        }

        float gridX = 0.06 * sin((uvContain.x * uImageSize.x + uTime * 40.0) * 0.012);
        float gridY = 0.06 * sin((uvContain.y * uImageSize.y + uTime * 40.0) * 0.012);
        float grid = (gridX + gridY) * 0.15;

        float prog = clamp(uProgress, 0.0, 1.0);
        float y = vUv.y;
        float thickness = 0.045;
        float core = smoothstep(prog - thickness, prog, y) - smoothstep(prog, prog + thickness, y);
        float glow = exp(-abs(y - prog) * 26.0);
        float halo = exp(-abs(y - prog) * 7.0) * 0.35;

        vec3 base = rgbShift(uvContain, y - prog);
        vec3 color = base;

        float n = hash(uvContain * (uImageSize + uTime * 8.0)) - 0.5;

        float scannedMask = step(y, prog);
        vec3 boost = color * 1.06 + vec3(0.08, 0.05, 0.02);
        color = mix(color, boost, scannedMask * 0.55);
        color += grid * scannedMask * 0.25;

        float e = sobel(uvContain);
        float edge = smoothstep(0.12, 0.23, e);
        color += vec3(edge) * (0.10 * scannedMask + 0.65 * core + 0.25 * halo);

        vec3 scanColor = vec3(1.0, 0.604, 0.145);
        color += scanColor * (core * 0.9 + glow * 0.25 + halo);
        color += n * (core + glow) * 0.12;

        float dist = distance(vUv, vec2(0.5));
        float vignette = smoothstep(0.95, 0.45, dist);
        color *= vignette * 0.08 + 0.96;

        gl_FragColor = vec4(color, 1.0);
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

    // Placeholder
    const placeholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    if ("colorSpace" in placeholder) placeholder.colorSpace = THREE.SRGBColorSpace;
    else placeholder.encoding = THREE.sRGBEncoding;
    placeholder.needsUpdate = true;
    uniforms.uTexture.value = placeholder;

    // Load image
    const loader = new THREE.TextureLoader();
    loader.load(
      image,
      (tex) => {
        if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
        else tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = isMobile ? 1 : Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
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

    // Resize handler
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

    // Animation
    const start = performance.now();
    const DURATION = Math.max(1200, durationMs);

    const animate = (now) => {
      const t = now - start;
      const p = Math.min(t / DURATION, 1);
      uniforms.uProgress.value = p;
      uniforms.uTime.value = now * 0.001;

      progressRef.current = p;
      setProgressPct(Math.round(p * 100));

      renderer.render(scene, camera);

      if (p < 1) rafRef.current = requestAnimationFrame(animate);
      else setTimeout(() => onDone && onDone(), 350);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
      try { container.removeChild(renderer.domElement); } catch {}
      renderer.dispose();
      quad.geometry.dispose();
      material.dispose();
      if (uniforms.uTexture.value && uniforms.uTexture.value !== placeholder) {
        uniforms.uTexture.value.dispose();
      }
      placeholder.dispose();
    };
  }, [image, onDone, durationMs, isMobile, pixelRatio]);

  // ====== RENDER ======
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-between text-black">
      {/* Preview Area */}
      <div className="w-full flex items-center justify-center mt-4 sm:mt-8 px-4 sm:px-6  max-w-sm">
        <div
          ref={frameRef}
          className="w-full max-w-[min(100vw-32px,420px)] sm:max-w-sm aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.4)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          style={{
            background: "radial-gradient(120% 140% at 50% -10%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)",
          }}
        >
          <img
            src={image}
            alt="Hasil tangkapan"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
            draggable={false}
            loading="eager"
          />

          <div ref={mountRef} className="absolute inset-0 z-10 w-full h-full" />

          <OverlayOCRBlocks blocks={blocks} progress01={progressRef.current} />
          <CornerFX progress01={progressRef.current} />
          <StatusIndicator progress={progressPct} />

          <div
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.22) 100%)",
            }}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="w-full pb-[max(24px,calc(env(safe-area-inset-bottom)+16px))] px-4 sm:px-6">
        <div className="mt-6 max-w-sm mx-auto text-center">
          <p className="text-base sm:text-lg font-semibold mb-3">Membaca struk…</p>

          <div className="relative w-full h-3 sm:h-4 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/15">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FF9A25] via-[#FFB347] to-[#FF9A25] rounded-full transition-[width] duration-200 ease-out"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0.05) 100%)",
              }}
            />
          </div>

          <p className="mt-2 text-black/80 text-xs sm:text-sm font-medium tabular-nums">{progressPct}%</p>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-[#FF9A25] animate-bounce"
                style={{ animationDelay: `${delay}ms`, animationDuration: "1s" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes ocr-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes corner-shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// ====== SUB COMPONENTS ======

function OverlayOCRBlocks({ blocks, progress01 }) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {blocks.map((b, i) => {
        const hit = progress01 >= b.y - 0.01;
        const opacity = hit ? 1 : 0;
        const delayMs = Math.round(60 + b.delayN * 180);
        const scale = hit ? 1 : 0.985;
        return (
          <span
            key={i}
            className="absolute rounded-sm sm:rounded-md"
            style={{
              left: `${b.x * 100}%`,
              width: `${b.w * 100}%`,
              top: `calc(${(b.y - b.h / 2) * 100}%)`,
              height: `calc(${b.h * 100}%)`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.92) 30%, rgba(255,255,255,0.98) 55%, rgba(255,255,255,0.92) 80%)",
              boxShadow: "0 6px 18px rgba(16, 24, 40, 0.18), inset 0 1px 0 rgba(255,255,255,0.75)",
              transform: `translateZ(0) scale(${scale})`,
              opacity,
              transition: `opacity 240ms cubic-bezier(.2,.7,.2,1) ${delayMs}ms, transform 260ms cubic-bezier(.2,.7,.2,1) ${delayMs}ms`,
              backgroundSize: "200% 100%",
              animation: hit ? `ocr-shimmer ${1200 + Math.round(b.glow * 600)}ms linear 1` : "none",
              border: "1px solid rgba(255,255,255,0.65)",
            }}
          />
        );
      })}

      <div
        className="absolute left-0 w-full"
        style={{
          top: `calc(${progress01 * 100}% - 1px)`,
          height: "2px",
          background: "linear-gradient(90deg, rgba(255,154,37,0) 0%, rgba(255,154,37,0.95) 25%, rgba(255,154,37,0.95) 75%, rgba(255,154,37,0) 100%)",
          filter: "drop-shadow(0 0 10px rgba(255,154,37,0.6))",
          opacity: 0.95,
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
  const gradH = `linear-gradient(90deg, ${accent(0)} 0%, ${accent(0.9)} 25%, ${accent(1)} 50%, ${accent(0.9)} 75%, ${accent(0)} 100%)`;
  const gradV = `linear-gradient(180deg, ${accent(0)} 0%, ${accent(0.9)} 25%, ${accent(1)} 50%, ${accent(0.9)} 75%, ${accent(0)} 100%)`;

  const cornerStyle = (intensity) => ({
    opacity: BASE_OP + 0.65 * intensity,
    filter: `drop-shadow(0 0 ${10 + 12 * intensity}px ${accent(0.65)})`,
  });

  const BarH = ({ style }) => (
    <span className="absolute rounded-full" style={{ ...style, height: THICK, width: LEN, backgroundImage: gradH, backgroundSize: "200% 100%", animation: "corner-shimmer 1800ms linear infinite" }} />
  );
  const BarV = ({ style }) => (
    <span className="absolute rounded-full" style={{ ...style, width: THICK, height: LEN, backgroundImage: gradV, backgroundSize: "200% 100%", animation: "corner-shimmer 1800ms linear infinite" }} />
  );

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div style={{ top: PAD, left: PAD, ...cornerStyle(topIntensity) }} className="absolute">
        <BarH style={{ left: 0, top: 0 }} />
        <BarV style={{ left: 0, top: 0 }} />
      </div>
      <div style={{ top: PAD, right: PAD, ...cornerStyle(topIntensity) }} className="absolute">
        <BarH style={{ right: 0, top: 0, transform: "scaleX(-1)" }} />
        <BarV style={{ right: 0, top: 0 }} />
      </div>
      <div style={{ bottom: PAD, left: PAD, ...cornerStyle(bottomIntensity) }} className="absolute">
        <BarH style={{ left: 0, bottom: 0 }} />
        <BarV style={{ left: 0, bottom: 0, transform: "scaleY(-1)" }} />
      </div>
      <div style={{ bottom: PAD, right: PAD, ...cornerStyle(bottomIntensity) }} className="absolute">
        <BarH style={{ right: 0, bottom: 0, transform: "scaleX(-1)" }} />
        <BarV style={{ right: 0, bottom: 0, transform: "scaleY(-1)" }} />
      </div>
    </div>
  );
}

function StatusIndicator({ progress }) {
  const status = progress < 30 ? "Memindai..." : progress < 70 ? "Menganalisis..." : progress < 100 ? "Menyelesaikan..." : "Selesai!";
  return (
    <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
        <div className="relative w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-[#FF9A25] animate-ping" style={{ animationDuration: "1.5s" }} />
          <span className="relative block w-2 h-2 rounded-full bg-[#FF9A25]" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-white/90">{status}</span>
      </div>
    </div>
  );
}