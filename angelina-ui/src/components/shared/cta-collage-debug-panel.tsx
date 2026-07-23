"use client";

import { useState } from "react";
import { DEFAULT_CTA_CONFIG, type CtaChoreographyConfig } from "./cta-collage-config";

interface CtaCollageDebugPanelProps {
  config: CtaChoreographyConfig;
  onChange: (config: CtaChoreographyConfig) => void;
}

interface SliderDef {
  key: keyof CtaChoreographyConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  { key: "scrub", label: "Scrub smoothness (s)", min: 0, max: 3, step: 0.1 },
  { key: "titleScaleStart", label: "Title start scale", min: 1, max: 2, step: 0.05 },
  { key: "titlePosition", label: "Title settle @", min: 0, max: 1, step: 0.01 },
  { key: "fadeInPosition", label: "Images fade-in @", min: 0, max: 1, step: 0.01 },
  { key: "settlePosition", label: "Images settle @", min: 0, max: 1, step: 0.01 },
  { key: "settleDuration", label: "Settle duration", min: 0.05, max: 1, step: 0.01 },
  { key: "exitPosition", label: "Collage exit @", min: 0, max: 1, step: 0.01 },
  { key: "burstSpread", label: "Burst spread ×", min: 0, max: 2, step: 0.05 },
  { key: "settleSpread", label: "Settle spread ×", min: 0, max: 2, step: 0.05 },
  { key: "orbitDuration", label: "Orbit duration (s)", min: 5, max: 60, step: 1 },
];

/** Dev-only control panel for CtaCollageClient — stripped from production builds (see the NODE_ENV check at the call site). */
export function CtaCollageDebugPanel({ config, onChange }: CtaCollageDebugPanelProps) {
  const [open, setOpen] = useState(false);

  const set = <K extends keyof CtaChoreographyConfig>(key: K, value: CtaChoreographyConfig[K]) =>
    onChange({ ...config, [key]: value });

  const scrubPreview = (fraction: number) => {
    const st = document.querySelector("[data-cta-wrapper]");
    if (!st) return;
    const rect = st.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    window.scrollTo({ top: top + rect.height * fraction, behavior: "auto" });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white text-lg shadow-lg backdrop-blur cursor-pointer"
        aria-label="Open CTA animation controls"
      >
        ⚙
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[300px] max-h-[80vh] overflow-y-auto rounded-2xl bg-black/85 p-5 text-white shadow-xl backdrop-blur font-mono text-xs">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold uppercase tracking-wider">CTA collage controls</p>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer opacity-70 hover:opacity-100" aria-label="Close">
          ✕
        </button>
      </div>

      <label className="flex items-center justify-between mb-4 cursor-pointer">
        <span>Orbit loop (a-113)</span>
        <input
          type="checkbox"
          checked={config.withOrbit}
          onChange={(e) => set("withOrbit", e.target.checked)}
          className="cursor-pointer"
        />
      </label>

      {SLIDERS.map(({ key, label, min, max, step }) => (
        <div key={key} className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span>{label}</span>
            <span className="opacity-70">{(config[key] as number).toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={config[key] as number}
            onChange={(e) => set(key, Number(e.target.value))}
            className="w-full cursor-pointer"
          />
        </div>
      ))}

      <div className="mb-4">
        <p className="mb-1">Preview scroll position</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          defaultValue={0}
          onChange={(e) => scrubPreview(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_CTA_CONFIG, withOrbit: config.withOrbit })}
        className="w-full rounded-full bg-white/10 py-2 uppercase tracking-wider hover:bg-white/20 cursor-pointer"
      >
        Reset values
      </button>
    </div>
  );
}
