import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Bars, Burst, Card, Cursor, Particles, ease } from "../components/ui";
import { RATE, RATE_IMPACT } from "../timeline";
import { C, LABELS, clamp, display, sans } from "../theme";

const CARD = { x: 60, y: 470, w: 960, h: 1080 };
const BARS = { w: 780, h: 380, gap: 18 };
const BARS_LEFT = (CARD.w - BARS.w) / 2; // inside card
const BARS_TOP = 300; // inside card
const BW = (BARS.w - BARS.gap * 9) / 10;

export const barCenterX = (i: number) => CARD.x + BARS_LEFT + i * (BW + BARS.gap) + BW / 2;
const barTopY = (i: number) => CARD.y + BARS_TOP + BARS.h * (1 - (0.28 + (0.72 * i) / 9));

export const Rate: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: ease.out });

  const fillAt = (i: number) => RATE.fillStart + i * RATE.fillStep;
  const score = Math.max(0, Math.min(10, Math.floor((frame - RATE.fillStart) / RATE.fillStep) + 1));
  const hit = frame >= RATE_IMPACT;

  // cursor sweeps across the bar tops
  const sweep = interpolate(frame, [RATE.fillStart - 6, RATE_IMPACT], [0, 9], {
    ...clamp,
    easing: ease.inOut,
  });
  const si = Math.min(9, Math.max(0, sweep));
  const lo = Math.floor(si);
  const hi = Math.min(9, lo + 1);
  const fr = si - lo;
  const cxSweep = barCenterX(lo) * (1 - fr) + barCenterX(hi) * fr;
  const cySweep = (barTopY(lo) * (1 - fr) + barTopY(hi) * fr) + 30;
  const cx = interpolate(frame, [RATE.cursorIn, RATE.fillStart - 6], [880, barCenterX(0)], { ...clamp, easing: ease.inOut });
  const cy = interpolate(frame, [RATE.cursorIn, RATE.fillStart - 6], [1700, barTopY(0) + 30], { ...clamp, easing: ease.inOut });
  const onSweep = frame >= RATE.fillStart - 6;

  const shake = hit ? interpolate(frame, [RATE_IMPACT, RATE_IMPACT + 22], [1, 0], clamp) : 0;
  const sx = Math.sin(frame * 2.7) * 14 * shake;
  const sy = Math.cos(frame * 3.1) * 10 * shake;
  const flash = interpolate(frame, [RATE_IMPACT, RATE_IMPACT + 3, RATE_IMPACT + 26], [0, 0.55, 0], clamp);
  const pop = interpolate(frame, [RATE_IMPACT, RATE_IMPACT + 30], [0, 1], { ...clamp, easing: ease.spring });

  const exitP = interpolate(frame, [RATE.exit, 270], [0, 1], { ...clamp, easing: ease.in });

  return (
    <AbsoluteFill>
      <Background glow={1 + flash} />
      <AbsoluteFill
        style={{
          translate: `${sx}px ${sy}px`,
          opacity: 1 - exitP,
          scale: String(interpolate(exitP, [0, 1], [1, 0.6])),
          filter: `blur(${exitP * 18 + (1 - enter) * 16}px)`,
        }}
      >
        {/* glow behind card that blooms on impact */}
        <div
          style={{
            position: "absolute",
            left: 540 - 520,
            top: CARD.y + 400 - 520,
            width: 1040,
            height: 1040,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(38,56,232,0.55) 0%, rgba(38,56,232,0) 65%)",
            opacity: hit ? interpolate(frame, [RATE_IMPACT, RATE_IMPACT + 12, RATE_IMPACT + 80], [0.2, 1, 0.55], clamp) : 0.2 + (score / 10) * 0.3,
            scale: String(1 + pop * 0.15),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            transform: `perspective(2200px) translateY(${(1 - enter) * 260}px) rotateX(${(1 - enter) * 24 + Math.sin(frame / 40) * 2}deg) scale(${0.92 + enter * 0.08})`,
            opacity: enter,
          }}
        >
          <Card style={{ width: CARD.w, height: CARD.h, position: "relative" }}>
            <div style={{ position: "absolute", left: 60, right: 60, top: 64 }}>
              <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.ink2 }}>
                THE MENTALIST · S1 E23
              </div>
              <div style={{ fontFamily: display, fontSize: 82, color: C.ink, marginTop: 18, lineHeight: 1.02 }}>
                Red John&apos;s Footsteps
              </div>
            </div>

            <div style={{ position: "absolute", left: BARS_LEFT, top: BARS_TOP }}>
              <Bars
                width={BARS.w}
                height={BARS.h}
                gap={BARS.gap}
                radius={10}
                minRatio={0.28}
                fill={(i) =>
                  interpolate(frame, [fillAt(i), fillAt(i) + 7], [0, 1], { ...clamp, easing: ease.out })
                }
                rise={(i) =>
                  1 +
                  interpolate(frame, [fillAt(i), fillAt(i) + 5, fillAt(i) + 16], [0, 0.06, 0], clamp) +
                  (hit ? interpolate(frame, [RATE_IMPACT + i * 1.5, RATE_IMPACT + i * 1.5 + 6, RATE_IMPACT + i * 1.5 + 22], [0, 0.08, 0], clamp) : 0)
                }
                activeColor={hit ? "#9AA4FF" : C.signal}
              />
            </div>

            {/* score readout */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 740,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 34,
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "baseline" }}>
                {hit ? (
                  <Burst
                    size={330}
                    color="rgba(125,137,255,0.22)"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      marginLeft: -205,
                      marginTop: -165,
                      scale: String(pop),
                      rotate: `${interpolate(frame, [RATE_IMPACT, RATE_IMPACT + 200], [-40, 30], clamp)}deg`,
                    }}
                  />
                ) : null}
                <span
                  style={{
                    position: "relative",
                    fontFamily: display,
                    fontSize: 230,
                    lineHeight: 1,
                    color: hit ? C.signal : C.ink,
                    textShadow: hit ? "0 0 60px rgba(125,137,255,0.6)" : "none",
                    scale: String(
                      1 +
                        (frame >= RATE.fillStart
                          ? interpolate((frame - RATE.fillStart) % RATE.fillStep, [0, 3, 9], [0.07, 0.02, 0]) * (hit ? 0 : 1)
                          : 0) +
                        (hit ? interpolate(frame, [RATE_IMPACT, RATE_IMPACT + 6, RATE_IMPACT + 24], [0, 0.22, 0], clamp) : 0),
                    ),
                    display: "inline-block",
                    minWidth: 120,
                    textAlign: "right",
                  }}
                >
                  {score === 0 ? "–" : score}
                </span>
                <span style={{ position: "relative", fontFamily: sans, fontSize: 64, fontWeight: 600, color: C.ink2 }}>
                  /10
                </span>
              </div>
              <div
                style={{
                  fontFamily: hit ? display : sans,
                  fontSize: hit ? 104 : 62,
                  fontWeight: hit ? 400 : 600,
                  color: hit ? C.ink : C.ink2,
                  minWidth: 300,
                  scale: String(hit ? 0.7 + pop * 0.3 : 1),
                  transformOrigin: "left center",
                }}
              >
                {score === 0 ? "Your score" : hit ? "Perfect." : LABELS[score]}
              </div>
            </div>
          </Card>
        </div>

        <Particles at={RATE_IMPACT} x={540} y={CARD.y + 840} count={34} spread={620} seed="rate" />
        <Cursor
          x={onSweep ? cxSweep : cx}
          y={onSweep ? cySweep : cy}
          hand
          press={interpolate(frame, [RATE_IMPACT - 3, RATE_IMPACT, RATE_IMPACT + 8], [0, 1, 0], clamp)}
          opacity={interpolate(frame, [RATE.cursorIn, RATE.cursorIn + 10, RATE_IMPACT + 30, RATE_IMPACT + 46], [0, 1, 1, 0], clamp)}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#C9CEFF", opacity: flash * 0.5, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
