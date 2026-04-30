"use client";

import { useState, useCallback } from "react";
import {
  type AvatarConfig,
  AvatarRenderer,
  Shapes,
  Eyes,
  Noses,
  BG_COLORS,
  SHAPE_KEYS,
  EYE_KEYS,
  NOSE_KEYS,
  PRESETS,
  randomConfig,
} from "./avatar-parts";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// CYCLER — left/right carousel for picking a part
// ─────────────────────────────────────────────────────────────
function Cycler<K extends string>({
  label,
  keys,
  value,
  onChange,
  renderThumb,
}: {
  label: string;
  keys: K[];
  value: K;
  onChange: (v: K) => void;
  renderThumb: (key: K) => React.ReactNode;
}) {
  const idx = keys.indexOf(value);
  const go = (delta: number) =>
    onChange(keys[(idx + delta + keys.length) % keys.length]!);

  const prev = keys[(idx - 1 + keys.length) % keys.length]!;
  const next = keys[(idx + 1) % keys.length]!;

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs font-medium text-muted-foreground shrink-0">
        {label}
      </span>
      <button
        type="button"
        onClick={() => go(-1)}
        className="flex items-center justify-center size-7 rounded-md hover:bg-accent transition-colors"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M15 5 L8 12 L15 19"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="flex items-center gap-1 flex-1 justify-center">
        <button
          type="button"
          onClick={() => go(-1)}
          className="opacity-30 hover:opacity-60 transition-opacity"
          tabIndex={-1}
        >
          {renderThumb(prev)}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="border-2 border-primary rounded-lg p-0.5"
        >
          {renderThumb(value)}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="opacity-30 hover:opacity-60 transition-opacity"
          tabIndex={-1}
        >
          {renderThumb(next)}
        </button>
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        className="flex items-center justify-center size-7 rounded-md hover:bg-accent transition-colors"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M9 5 L16 12 L9 19"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AVATAR GENERATOR
// ─────────────────────────────────────────────────────────────
interface AvatarGeneratorProps {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

export function AvatarGenerator({ config, onChange }: AvatarGeneratorProps) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");

  const setField = useCallback(
    <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const renderShapeThumb = (key: string) => (
    <svg viewBox="0 0 200 200" width="40" height="40">
      {Shapes[key]?.render()}
    </svg>
  );
  const renderNoseThumb = (key: string) => (
    <svg viewBox="-14 -10 28 20" width="36" height="24">
      {Noses[key]?.render()}
    </svg>
  );
  const renderEyeThumb = (key: string) => (
    <svg viewBox="-18 -8 36 16" width="44" height="22">
      {Eyes[key]?.render(8)}
    </svg>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="rounded-2xl bg-background p-2 shadow-sm border border-border">
          <AvatarRenderer config={config} size={160} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setTab("presets")}
          className={cn(
            "flex-1 pb-2 text-sm font-medium text-center transition-colors border-b-2",
            tab === "presets"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          预设
        </button>
        <button
          type="button"
          onClick={() => setTab("custom")}
          className={cn(
            "flex-1 pb-2 text-sm font-medium text-center transition-colors border-b-2",
            tab === "custom"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          自定义
        </button>
      </div>

      {/* Tab content */}
      {tab === "presets" && (
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const isActive =
              p.config.shape === config.shape &&
              p.config.eye === config.eye &&
              p.config.nose === config.nose &&
              p.config.bg === config.bg;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onChange(p.config)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <AvatarRenderer config={p.config} size={48} />
                <span className="text-[10px] text-muted-foreground">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "custom" && (
        <div className="flex flex-col gap-4">
          <Cycler
            label="轮廓"
            keys={SHAPE_KEYS}
            value={config.shape}
            onChange={(v) => setField("shape", v)}
            renderThumb={renderShapeThumb}
          />
          <Cycler
            label="眼睛"
            keys={EYE_KEYS}
            value={config.eye}
            onChange={(v) => setField("eye", v)}
            renderThumb={renderEyeThumb}
          />
          <Cycler
            label="鼻子"
            keys={NOSE_KEYS}
            value={config.nose}
            onChange={(v) => setField("nose", v)}
            renderThumb={renderNoseThumb}
          />

          {/* Background colors */}
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              背景色
            </div>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((c, i) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setField("bg", i)}
                  title={c.name}
                  className={cn(
                    "size-7 rounded-full transition-shadow",
                    config.bg === i
                      ? "ring-2 ring-primary ring-offset-2"
                      : "ring-1 ring-border"
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Random button */}
      <button
        type="button"
        onClick={() => onChange(randomConfig())}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        随机生成
      </button>
    </div>
  );
}
