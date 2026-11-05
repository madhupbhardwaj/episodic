import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Bars, Burst, Particles, Words, ease } from "../components/ui";
import { END } from "../timeline";
import { C, clamp, display, sans } from "../theme";

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = interpolate(frame, [END.hit, END.hit + 34], [0, 1], { ...clamp, easing: ease.spring });
  const ring = interpolate(frame, [0, 50], [0, 1], { ...clamp, easing: ease.out });
  const lift = interpolate(frame, [END.wordmark - 6, END.wordmark + 30], [0, 1], { ...clamp, easing: ease.inOut });
  const word = interpolate(frame, [END.wordmark, END.wordmark + 34], [0, 1], { ...clamp, easing: ease.out });
  const url = interpolate(frame, [END.url, END.url + 26], [0, 1], { ...clamp, easing: ease.out });
  const fade = interpolate(frame, [END.fadeOut, 330], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Background glow={1.2} />
      {/* bloom */}
      <div
        style={{
          position: "absolute",
          left: 540 - 560,
          top: 760 - 560 - lift * 160,
          width: 1120,
          height: 1120,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(38,56,232,0.55) 0%, rgba(38,56,232,0) 62%)",
          opacity: interpolate(frame, [0, 8, 80], [0, 1, 0.7], clamp),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 260,
          top: 760 - 260,
          width: 520,
          height: 520,
          borderRadius: 999,
          border: `5px solid ${C.signal}`,
          opacity: 1 - ring,
          scale: String(0.3 + ring * 1.6),
        }}
      />
      <Particles at={0} x={540} y={760} count={26} spread={600} seed="end" />

      <div
        style={{
          position: "absolute",
          left: 540 - 150,
          top: 760 - 150,
          translate: `0px ${-lift * 170}px`,
          scale: String(logo * interpolate(lift, [0, 1], [1.15, 0.8])),
          rotate: `${(1 - logo) * -120}deg`,
          filter: "drop-shadow(0 0 60px rgba(125,137,255,0.6))",
        }}
      >
        <Burst size={300} color="#FFFFFF" />
      </div>

      <div
        style={{
          position: "absolute",
          top: 790,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: display,
          fontSize: 230,
          lineHeight: 1,
          color: C.ink,
          letterSpacing: -3,
          clipPath: `inset(0 ${(1 - word) * 50}% 0 ${(1 - word) * 50}%)`,
          opacity: word,
          filter: `blur(${(1 - word) * 10}px)`,
          scale: String(0.94 + word * 0.06),
        }}
      >
        Tenbars
      </div>

      <div style={{ position: "absolute", top: 1100, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Words text={"Score every episode\nyou watch, out of 10."} accent={["10"]} start={END.tagline} stagger={4} size={66} weight={600} color={C.ink2} lineHeight={1.2} />
      </div>

      <div style={{ position: "absolute", top: 1340, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Bars
          width={440}
          height={120}
          gap={12}
          radius={5}
          rise={(i) => interpolate(frame, [END.tagline + 20 + i * 3, END.tagline + 36 + i * 3], [0, 1], { ...clamp, easing: ease.spring })}
          fill={(i) => interpolate(frame, [END.tagline + 24 + i * 3, END.tagline + 34 + i * 3], [0, 1], clamp)}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1560,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: url,
          translate: `0px ${(1 - url) * 40}px`,
        }}
      >
        <div
          style={{
            padding: "26px 54px",
            borderRadius: 999,
            border: `2px solid ${C.line}`,
            background: "rgba(125,137,255,0.08)",
            fontFamily: sans,
            fontSize: 42,
            fontWeight: 600,
            color: C.ink,
            letterSpacing: 0.5,
          }}
        >
          tenbars.vercel.app
        </div>
      </div>
    </AbsoluteFill>
  );
};
