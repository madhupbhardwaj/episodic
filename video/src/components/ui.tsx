import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";
import { BURST_D, C, clamp, display, sans } from "../theme";

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  spring: Easing.spring({ damping: 14, mass: 0.8, stiffness: 160 }),
  soft: Easing.spring({ damping: 200 }),
};

/** Midnight background with slowly drifting blue glows and a vignette. */
export const Background: React.FC<{ glow?: number; hue?: number }> = ({
  glow = 1,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${50 + Math.sin(t * 0.35) * 8}% ${42 + Math.cos(t * 0.27) * 6}%, ${C.bgGlow} 0%, rgba(24,32,74,0) 70%)`,
          opacity: glow,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 600px at ${30 + Math.cos(t * 0.3) * 10}% ${85 + Math.sin(t * 0.4) * 4}%, rgba(38,56,232,0.22) 0%, rgba(38,56,232,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(130% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** The Tenbars burst mark. */
export const Burst: React.FC<{
  size: number;
  color?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ size, color = C.signal, style, children }) => (
  <div
    style={{
      position: "relative",
      width: size,
      height: size,
      display: "grid",
      placeItems: "center",
      ...style,
    }}
  >
    <svg
      viewBox="0 0 32 32"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <path d={BURST_D} fill={color} />
    </svg>
    {children ? <div style={{ position: "relative" }}>{children}</div> : null}
  </div>
);

/** Small logo lockup used in UI headers. */
export const Lockup: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
    <Burst size={size} color={C.ink} />
    <span
      style={{
        fontFamily: display,
        fontSize: size * 1.05,
        color: C.ink,
        lineHeight: 1,
        letterSpacing: -0.5,
      }}
    >
      Tenbars
    </span>
  </div>
);

/**
 * The signature ten ascending bars.
 * `fill(i)` returns 0..1 for how "on" bar i is; `rise(i)` 0..1 for its height.
 */
export const Bars: React.FC<{
  width: number;
  height: number;
  gap?: number;
  fill?: (i: number) => number;
  rise?: (i: number) => number;
  activeColor?: string;
  baseColor?: string;
  minRatio?: number;
  radius?: number;
}> = ({
  width,
  height,
  gap = 14,
  fill = () => 1,
  rise = () => 1,
  activeColor = C.signal,
  baseColor = C.sunk,
  minRatio = 0.3,
  radius = 6,
}) => {
  const bw = (width - gap * 9) / 10;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap,
        width,
        height,
      }}
    >
      {new Array(10).fill(0).map((_, i) => {
        const h = height * (minRatio + ((1 - minRatio) * i) / 9);
        const f = fill(i);
        const r = rise(i);
        return (
          <div
            key={i}
            style={{
              width: bw,
              height: h * r,
              borderRadius: radius,
              background: baseColor,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${f * 100}%`,
                background: activeColor,
                borderRadius: radius,
                boxShadow: f > 0.5 ? `0 0 ${24 * f}px rgba(125,137,255,${0.45 * f})` : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/** Words that land one by one: rise, unblur, fade. */
export const Words: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  accent?: string[]; // words drawn in Gloock + signal color
  size: number;
  color?: string;
  weight?: number;
  align?: "left" | "center";
  lineHeight?: number;
  style?: React.CSSProperties;
  out?: number; // frame to exit
}> = ({
  text,
  start,
  stagger = 5,
  accent = [],
  size,
  color = C.ink,
  weight = 700,
  align = "center",
  lineHeight = 1.06,
  style,
  out,
}) => {
  const frame = useCurrentFrame();
  const lines = text.split("\n");
  let k = 0;
  return (
    <div
      style={{
        fontFamily: sans,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: -size * 0.025,
        lineHeight,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {line.split(" ").map((w, wi) => {
            const idx = k++;
            const s = start + idx * stagger;
            const isAccent = accent.includes(w.replace(/[.,!?]/g, "")) || accent.includes(w);
            const p = interpolate(frame, [s, s + 18], [0, 1], {
              ...clamp,
              easing: ease.out,
            });
            const o =
              out !== undefined
                ? interpolate(frame, [out + idx * 2, out + idx * 2 + 12], [0, 1], {
                    ...clamp,
                    easing: ease.in,
                  })
                : 0;
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  marginRight: size * 0.24,
                  opacity: p * (1 - o),
                  translate: `0px ${(1 - p) * size * 0.55 - o * size * 0.4}px`,
                  filter: `blur(${(1 - p) * 10 + o * 8}px)`,
                  fontFamily: isAccent ? display : sans,
                  fontWeight: isAccent ? 400 : weight,
                  color: isAccent ? C.signal : color,
                  fontSize: isAccent ? size * 1.08 : size,
                  letterSpacing: isAccent ? -size * 0.01 : undefined,
                  textShadow: isAccent ? "0 0 40px rgba(125,137,255,0.45)" : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** macOS-style pointer. */
export const Cursor: React.FC<{
  x: number;
  y: number;
  press?: number; // 0..1 click squash
  opacity?: number;
  hand?: boolean;
}> = ({ x, y, press = 0, opacity = 1, hand = false }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 64,
      height: 64,
      opacity,
      scale: String(1 - press * 0.18),
      transformOrigin: "8px 6px",
      filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.55))",
      zIndex: 50,
    }}
  >
    {hand ? (
      <svg viewBox="0 0 32 32" width={64} height={64}>
        <path
          d="M11 4.5c0-1.4 2.6-1.4 2.6 0V14h.4V11.6c0-1.4 2.6-1.4 2.6 0V14h.4v-1.6c0-1.4 2.6-1.4 2.6 0V14.6h.3v-.9c0-1.4 2.6-1.4 2.6 0V21c0 4-2.6 7-6.6 7h-1.2c-2.4 0-3.8-1-5.2-2.8L5 19.4c-.8-1.1.8-2.6 2-1.6l4 3.3V4.5z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg viewBox="0 0 32 32" width={64} height={64}>
        <path
          d="M5 3 L5 25 L10.6 19.8 L14.4 28.4 L18.2 26.8 L14.5 18.4 L22 18.2 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </div>
);

/** Click ripple ring. */
export const Ripple: React.FC<{ x: number; y: number; at: number }> = ({
  x,
  y,
  at,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 24], [0, 1], clamp);
  if (frame < at || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 60,
        top: y - 60,
        width: 120,
        height: 120,
        borderRadius: 999,
        border: `3px solid ${C.signal}`,
        opacity: 1 - p,
        scale: String(0.2 + p * 0.9),
        zIndex: 49,
      }}
    />
  );
};

/** Radial particle burst, deterministic. */
export const Particles: React.FC<{
  at: number;
  x: number;
  y: number;
  count?: number;
  spread?: number;
  seed?: string;
  colors?: string[];
}> = ({
  at,
  x,
  y,
  count = 28,
  spread = 520,
  seed = "p",
  colors = [C.signal, C.ink, "#B4BCFF"],
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 90) return null;
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const d = spread * (0.35 + random(`${seed}d${i}`) * 0.65);
        const p = interpolate(t, [0, 60], [0, 1], { ...clamp, easing: ease.out });
        const fade = interpolate(t, [30, 90], [1, 0], clamp);
        const s = 8 + random(`${seed}s${i}`) * 16;
        const isBurst = i % 4 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * d * p - s / 2,
              top: y + Math.sin(a) * d * p - s / 2 + t * t * 0.02,
              width: s,
              height: s,
              opacity: fade,
              rotate: `${t * 4 * (random(`${seed}r${i}`) - 0.5)}deg`,
            }}
          >
            {isBurst ? (
              <Burst size={s * 1.6} color={colors[i % colors.length]} />
            ) : (
              <div
                style={{
                  width: s,
                  height: s,
                  borderRadius: 999,
                  background: colors[i % colors.length],
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

export const Card: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ style, children }) => (
  <div
    style={{
      background: `linear-gradient(180deg, ${C.surface2} 0%, ${C.surface} 100%)`,
      border: `2px solid ${C.line}`,
      borderRadius: 36,
      boxShadow:
        "0 50px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Stylized poster for The Mentalist (no copyrighted art). */
export const Poster: React.FC<{ w: number; h: number; radius?: number }> = ({
  w,
  h,
  radius = 14,
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      overflow: "hidden",
      position: "relative",
      background:
        "linear-gradient(160deg, #3A1414 0%, #1A0B0F 55%, #0E0A12 100%)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
      flex: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(60% 45% at 50% 38%, rgba(214,58,58,0.55) 0%, rgba(214,58,58,0) 70%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: h * 0.09,
        textAlign: "center",
        fontFamily: display,
        color: "#F3E9E4",
        fontSize: w * 0.15,
        letterSpacing: w * 0.012,
        lineHeight: 1,
      }}
    >
      THE
      <br />
      MENTALIST
    </div>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: h * 0.2,
        width: w * 0.42,
        height: w * 0.42,
        marginLeft: -w * 0.21,
        borderRadius: 999,
        border: `${Math.max(2, w * 0.02)}px solid rgba(232,90,90,0.75)`,
      }}
    />
  </div>
);

/** Shorthand: progress of a spring from frame `at` over `dur` frames. */
export const useP = (at: number, dur = 30, easing = ease.out) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing });
};
