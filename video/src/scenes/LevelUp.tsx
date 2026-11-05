import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Burst, Particles, Words, ease } from "../components/ui";
import { LEVEL } from "../timeline";
import { C, clamp, display, sans } from "../theme";

const BADGE_Y = 760;

export const LevelUp: React.FC = () => {
  const frame = useCurrentFrame();
  const L = LEVEL.levelUp;
  const enter = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: ease.out });
  const up = frame >= L;

  const flip = interpolate(frame, [L - 14, L + 8], [0, 360], { ...clamp, easing: ease.inOut });
  const shown = flip >= 180 ? 2 : 1;
  const pop = interpolate(frame, [L, L + 6, L + 28], [0, 0.2, 0], { ...clamp });
  const ring = interpolate(frame, [L, L + 40], [0, 1], { ...clamp, easing: ease.out });

  const count = frame >= LEVEL.countTick ? 20 : 19;
  const countRoll = interpolate(frame, [LEVEL.countTick, LEVEL.countTick + 12], [0, 1], { ...clamp, easing: ease.out });

  const prog1 = interpolate(frame, [LEVEL.fillStart, LEVEL.fillEnd], [14 / 15, 1], { ...clamp, easing: ease.inOut });
  const prog2 = interpolate(frame, [L + 10, L + 50], [0, 0.03], { ...clamp, easing: ease.out });
  const prog = up ? prog2 : prog1;

  const nameSwap = interpolate(frame, [L, L + 18], [0, 1], { ...clamp, easing: ease.out });

  const exit = interpolate(frame, [LEVEL.exit, 210], [0, 1], { ...clamp, easing: ease.in });

  return (
    <AbsoluteFill>
      <Background glow={1 + ring * (1 - ring) * 2} />
      <AbsoluteFill
        style={{
          opacity: enter,
          translate: `${-exit * 1200}px 0px`,
          filter: `blur(${(1 - enter) * 16 + exit * 26}px)`,
        }}
      >
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Words text="Rate more. Level up." accent={["Level", "up"]} start={LEVEL.captionIn} stagger={6} size={86} />
        </div>

        {/* shockwave */}
        {up ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 300,
              top: BADGE_Y - 300,
              width: 600,
              height: 600,
              borderRadius: 999,
              border: `6px solid ${C.signal}`,
              opacity: 1 - ring,
              scale: String(0.5 + ring * 1.4),
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 540 - 420,
            top: BADGE_Y - 420,
            width: 840,
            height: 840,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(38,56,232,0.6) 0%, rgba(38,56,232,0) 62%)",
            opacity: up ? interpolate(frame, [L, L + 10, L + 90], [0.4, 1, 0.6], clamp) : 0.35,
          }}
        />

        {/* rotating rays */}
        {up ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 450,
              top: BADGE_Y - 450,
              width: 900,
              height: 900,
              opacity: interpolate(frame, [L, L + 12, L + 120], [0, 0.5, 0.2], clamp),
              rotate: `${(frame - L) * 0.4}deg`,
              background:
                "repeating-conic-gradient(from 0deg, rgba(125,137,255,0.35) 0deg 6deg, rgba(125,137,255,0) 6deg 30deg)",
              maskImage: "radial-gradient(circle, black 20%, transparent 68%)",
              WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 68%)",
            }}
          />
        ) : null}

        {/* badge */}
        <div
          style={{
            position: "absolute",
            left: 540 - 200,
            top: BADGE_Y - 200,
            transform: `perspective(1400px) rotateY(${flip}deg) scale(${interpolate(enter, [0, 1], [0.4, 1]) + pop})`,
          }}
        >
          <Burst size={400} color={C.signal} style={{ filter: "drop-shadow(0 0 50px rgba(125,137,255,0.55))" }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 170,
                fontWeight: 800,
                color: C.signalInk,
                display: "inline-block",
                transform: flip > 90 && flip < 270 ? "scaleX(-1)" : undefined,
              }}
            >
              {shown}
            </span>
          </Burst>
        </div>
        <Particles at={L} x={540} y={BADGE_Y} count={30} spread={560} seed="lvl" />

        {/* level name */}
        <div style={{ position: "absolute", top: 1030, left: 0, right: 0, textAlign: "center" }}>
          <div
            style={{
              fontFamily: sans,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 5,
              color: up ? C.signal : C.ink2,
            }}
          >
            {up ? "LEVEL 2 REACHED" : "LEVEL 1"}
          </div>
          <div style={{ position: "relative", height: 170, marginTop: 10 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                fontFamily: display,
                fontSize: 156,
                color: C.ink,
                opacity: 1 - nameSwap,
                translate: `0px ${-nameSwap * 60}px`,
                filter: `blur(${nameSwap * 12}px)`,
              }}
            >
              Pilot
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                fontFamily: display,
                fontSize: 156,
                color: C.ink,
                opacity: nameSwap,
                translate: `0px ${(1 - nameSwap) * 60}px`,
                filter: `blur(${(1 - nameSwap) * 12}px)`,
                textShadow: "0 0 50px rgba(125,137,255,0.5)",
              }}
            >
              Regular
            </div>
          </div>
        </div>

        {/* progress */}
        <div style={{ position: "absolute", top: 1330, left: 140, width: 800 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontFamily: sans,
              fontSize: 32,
              fontWeight: 600,
              color: C.ink2,
            }}
          >
            <span>Episodes rated</span>
            <span style={{ position: "relative", height: 64, overflow: "hidden", display: "inline-block", width: 120, textAlign: "right" }}>
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  fontFamily: display,
                  fontSize: 60,
                  fontWeight: 400,
                  color: C.ink,
                  translate: `0px ${-countRoll * 64}px`,
                  lineHeight: "64px",
                }}
              >
                19
              </span>
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  fontFamily: display,
                  fontSize: 60,
                  fontWeight: 400,
                  color: count === 20 ? C.signal : C.ink,
                  translate: `0px ${(1 - countRoll) * 64}px`,
                  lineHeight: "64px",
                }}
              >
                20
              </span>
            </span>
          </div>
          <div style={{ marginTop: 20, height: 22, borderRadius: 11, background: C.sunk, overflow: "hidden" }}>
            <div
              style={{
                width: `${prog * 100}%`,
                height: "100%",
                borderRadius: 11,
                background: C.signal,
                boxShadow: "0 0 24px rgba(125,137,255,0.7)",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: sans,
              fontSize: 28,
              fontWeight: 500,
              color: C.ink3,
              textAlign: "right",
            }}
          >
            {up ? "Next: Binger at 50" : "Next: Regular at 20"}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
