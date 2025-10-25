import { useEffect, useMemo, useState, useCallback, useRef } from "react";

/** Fallback bawaan */
const FALLBACK_COLORS = [
  { key: "green",  css: "linear-gradient(101.06deg,#2F5755 23.71%,#1A3A38 60.76%,#041D1C 97.82%)", label: "Green" },
  { key: "olive",  css: "linear-gradient(101.06deg,#3F6C2F 23.71%,#254818 60.76%,#0C2004 97.82%)", label: "Olive" },
  { key: "blue",   css: "linear-gradient(101.06deg,#135B82 23.71%,#0F435F 60.76%,#0F2835 97.82%)", label: "Blue" },
  { key: "indigo", css: "linear-gradient(101.06deg,#3D46A3 23.71%,#2E3276 60.76%,#181B44 97.82%)", label: "Indigo" },
  { key: "brown",  css: "linear-gradient(101.06deg,#7C3F26 23.71%,#5C2D1B 60.76%,#2C130A 97.82%)", label: "Brown" },
  { key: "pink",   css: "linear-gradient(101.06deg,#E06A99 23.71%,#C35082 60.76%,#8D2453 97.82%)", label: "Pink" },
];

export const DEFAULT_GRADIENT = FALLBACK_COLORS[0].css;

/**
 * props:
 * - value: string css gradient yang terpilih (controlled)
 * - onChange: (css, optionObj) => void
 * - options: array { key, css, label }
 * - fetchOptions: async () => array { key, css, label }   // opsional, bila ambil dari API
 * - size: 'sm' | 'md' | 'lg'
 * - className: string
 */
export default function WalletColorPicker({
  value,
  onChange,
  options,
  fetchOptions,
  size = "md",
  className = "",
}) {
  const [loaded, setLoaded] = useState([]);
  const items = useMemo(
    () => (loaded.length ? loaded : Array.isArray(options) && options.length ? options : FALLBACK_COLORS),
    [loaded, options]
  );

  // load dari API kalau disediakan
  useEffect(() => {
    let mounted = true;
    if (!fetchOptions) return;
    (async () => {
      try {
        const res = await fetchOptions();
        if (mounted && Array.isArray(res) && res.length) {
          setLoaded(res);
        }
      } catch {
        // diamkan: fallback tetap jalan
      }
    })();
    return () => { mounted = false; };
  }, [fetchOptions]);

  const handleSelect = useCallback((opt) => {
    onChange?.(opt.css, opt);
  }, [onChange]);

  // keyboard support
  const groupRef = useRef(null);
  const idx = Math.max(0, items.findIndex((o) => o.css === value));
  const move = (dir) => {
    const next = (idx + dir + items.length) % items.length;
    handleSelect(items[next]);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); move(-1); }
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleSelect(items[idx] || items[0]); }
  };

  const sizeCls = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Pick wallet color"
      className={`flex items-center gap-3 ${className}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {items.map((opt) => {
        const active = value === opt.css;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label || opt.key}
            onClick={() => handleSelect(opt)}
            className={[
              `${sizeCls} rounded-md border transition`,
              active ? "ring-2 ring-gray-800 scale-105" : "border-gray-200 hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-gray-800/50"
            ].join(" ")}
            style={{ background: opt.css }}
          />
        );
      })}
    </div>
  );
}
