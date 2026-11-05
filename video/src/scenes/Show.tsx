import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Background, Bars, Card, Cursor, Poster, Ripple, ease } from "../components/ui";
import { SHOW } from "../timeline";
import { C, clamp, display, sans } from "../theme";

export const ROW_H = 150;
export const PANEL = { x: 50, y: 860, w: 980, h: 960 };
const TARGET_ROW = 22; // E23 (0-indexed)
const TARGET_VISIBLE_TOP = 400;
export const SCROLL_MAX = TARGET_ROW * ROW_H - TARGET_VISIBLE_TOP;

// Previously rated episodes (E1–E19): the user's history
const pastScore = (i: number) => (i < 19 ? 6 + Math.floor(random(`s${i}`) * 4) : 0);

export const scrollAt = (frame: number) =>
  interpolate(frame, [SHOW.scrollStart, SHOW.scrollEnd], [0, SCROLL_MAX], {
    ...clamp,
    easing: ease.inOut,
  });

export const Show: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 28], [0, 1], { ...clamp, easing: ease.out });
  const scroll = scrollAt(frame);
  const vel = Math.abs(scrollAt(frame + 1) - scroll);

  const sActive = interpolate(frame, [SHOW.seasonClick, SHOW.seasonClick + 8], [0, 1], clamp);
  const flash = interpolate(frame, [SHOW.e23Flash, SHOW.e23Flash + 10, SHOW.e23Flash + 50], [0, 1, 0.45], clamp);

  const targetY = PANEL.y + TARGET_VISIBLE_TOP + ROW_H / 2;
  const push = interpolate(frame, [SHOW.e23Flash, SHOW.rowClick], [1, 1.1], {
    ...clamp,
    easing: ease.soft,
    output: "perceptual-scale",
  });
  const zoom = interpolate(frame, [SHOW.exit, 240], [1, 4.2], {
    ...clamp,
    easing: ease.in,
    output: "perceptual-scale",
  });

  const cx = interpolate(
    frame,
    [12, SHOW.seasonClick - 2, SHOW.scrollStart + 10, SHOW.e23Flash + 10, SHOW.rowClick - 4],
    [900, 170, 520, 520, 880],
    { ...clamp, easing: ease.inOut },
  );
  const cy = interpolate(
    frame,
    [12, SHOW.seasonClick - 2, SHOW.scrollStart + 10, SHOW.e23Flash + 10, SHOW.rowClick - 4],
    [1500, 760, 1150, 1150, targetY - 6],
    { ...clamp, easing: ease.inOut },
  );
  const press =
    interpolate(frame, [SHOW.seasonClick - 2, SHOW.seasonClick, SHOW.seasonClick + 6], [0, 1, 0], clamp) +
    interpolate(frame, [SHOW.rowClick - 2, SHOW.rowClick, SHOW.rowClick + 6], [0, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          transformOrigin: `${880}px ${targetY}px`,
          scale: String(push * zoom),
          opacity: interpolate(frame, [SHOW.exit + 16, 240], [1, 0], clamp) * enter,
          filter: `blur(${(1 - enter) * 20 + interpolate(frame, [SHOW.exit + 6, 240], [0, 22], clamp)}px)`,
        }}
      >
        <AbsoluteFill style={{ scale: String(interpolate(enter, [0, 1], [0.72, 1])) }}>
          {/* Show header */}
          <div style={{ position: "absolute", left: 70, top: 230, display: "flex", gap: 44 }}>
            <Poster w={268} h={386} radius={20} />
            <div style={{ paddingTop: 20 }}>
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: C.signal,
                }}
              >
                SERIES
              </div>
              <div style={{ fontFamily: display, fontSize: 116, lineHeight: 0.98, color: C.ink, marginTop: 14 }}>
                The
                <br />
                Mentalist
              </div>
              <div style={{ fontFamily: sans, fontSize: 30, color: C.ink2, marginTop: 24, fontWeight: 500 }}>
                2008 – 2015 · 7 seasons
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
                {["Crime", "Drama", "Mystery"].map((g) => (
                  <div
                    key={g}
                    style={{
                      fontFamily: sans,
                      fontSize: 24,
                      fontWeight: 600,
                      color: C.ink2,
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: `2px solid ${C.line}`,
                    }}
                  >
                    {g}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Season pills */}
          <div style={{ position: "absolute", left: 70, top: 712, display: "flex", gap: 14 }}>
            {new Array(7).fill(0).map((_, i) => {
              const p = interpolate(frame, [14 + i * 3, 30 + i * 3], [0, 1], { ...clamp, easing: ease.out });
              const active = i === 0 ? sActive : 0;
              return (
                <div
                  key={i}
                  style={{
                    width: 116,
                    height: 82,
                    borderRadius: 18,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: sans,
                    fontSize: 32,
                    fontWeight: 700,
                    color: active > 0.5 ? C.signalInk : C.ink2,
                    background: active > 0 ? `rgba(125,137,255,${active})` : C.surface,
                    border: `2px solid ${active > 0.5 ? C.signal : C.line}`,
                    opacity: p,
                    translate: `0px ${(1 - p) * 30}px`,
                    scale: String(1 + (i === 0 ? interpolate(frame, [SHOW.seasonClick, SHOW.seasonClick + 5, SHOW.seasonClick + 14], [0, -0.06, 0], clamp) : 0)),
                  }}
                >
                  S{i + 1}
                </div>
              );
            })}
          </div>

          {/* Episode list */}
          <Card
            style={{
              position: "absolute",
              left: PANEL.x,
              top: PANEL.y,
              width: PANEL.w,
              height: PANEL.h,
              overflow: "hidden",
              opacity: interpolate(frame, [26, 44], [0, 1], clamp),
              translate: `0px ${interpolate(frame, [26, 50], [80, 0], { ...clamp, easing: ease.out })}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: -scroll,
                filter: `blur(${Math.min(5, vel * 0.08)}px)`,
              }}
            >
              {new Array(23).fill(0).map((_, i) => {
                const isTarget = i === TARGET_ROW;
                const score = pastScore(i);
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: i * ROW_H,
                      left: 0,
                      right: 0,
                      height: ROW_H,
                      display: "flex",
                      alignItems: "center",
                      gap: 30,
                      padding: "0 40px",
                      borderBottom: `2px solid ${C.line}`,
                      background: isTarget ? `rgba(125,137,255,${0.16 * flash})` : undefined,
                      boxShadow: isTarget ? `inset 0 0 0 3px rgba(125,137,255,${0.7 * flash})` : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        textAlign: "right",
                        fontFamily: display,
                        fontSize: 58,
                        color: isTarget ? C.ink : C.ink2,
                        lineHeight: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isTarget ? (
                        <>
                          <div style={{ fontFamily: sans, fontSize: 36, fontWeight: 600, color: C.ink }}>
                            Red John&apos;s Footsteps
                          </div>
                          <div style={{ fontFamily: sans, fontSize: 25, color: C.ink2, marginTop: 6, fontWeight: 500 }}>
                            S1 · E23 · Season finale
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              width: 200 + random(`w${i}`) * 180,
                              height: 22,
                              borderRadius: 11,
                              background: "rgba(236,237,239,0.16)",
                            }}
                          />
                          <div
                            style={{
                              width: 150 + random(`m${i}`) * 60,
                              height: 16,
                              borderRadius: 8,
                              marginTop: 16,
                              background: "rgba(236,237,239,0.08)",
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                      <Bars
                        width={200}
                        height={56}
                        gap={5}
                        radius={3}
                        fill={(b) => (b < score ? 1 : 0)}
                        activeColor={b2c(score)}
                        minRatio={0.32}
                      />
                      <div
                        style={{
                          width: 44,
                          fontFamily: display,
                          fontSize: 40,
                          color: score ? C.ink : C.ink3,
                          textAlign: "right",
                        }}
                      >
                        {score || "–"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </AbsoluteFill>

        <Ripple x={178} y={766} at={SHOW.seasonClick} />
        <Ripple x={888} y={targetY} at={SHOW.rowClick} />
        <Cursor
          x={cx}
          y={cy}
          press={press}
          hand
          opacity={interpolate(frame, [12, 22], [0, 1], clamp)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const b2c = (score: number) => (score ? "rgba(125,137,255,0.55)" : C.signal);
