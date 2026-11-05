import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Background,
  Card,
  Cursor,
  Lockup,
  Poster,
  Ripple,
  Words,
  ease,
} from "../components/ui";
import { SEARCH } from "../timeline";
import { C, clamp, display, sans } from "../theme";

const CARD_W = 940;
const ROW = { x: 44, y: 360, w: 852, h: 220 };

export const Search: React.FC = () => {
  const frame = useCurrentFrame();
  const { cursorIn, inputClick, typeStart, typeStep, query, resultsIn, resultClick, exit } = SEARCH;

  const typed = Math.max(0, Math.min(query.length, Math.floor((frame - typeStart) / typeStep) + 1));
  const text = frame < typeStart ? "" : query.slice(0, typed);
  const focused = frame >= inputClick;
  const caretOn = Math.floor(frame / 16) % 2 === 0 || (frame > typeStart && frame < typeStart + query.length * typeStep + 6);

  // Cursor path in card space
  const cx = interpolate(
    frame,
    [cursorIn, inputClick - 2, typeStart + 10, typeStart + 30, resultsIn + 8, resultClick - 4],
    [1000, 420, 420, 760, 760, 520],
    { ...clamp, easing: ease.inOut },
  );
  const cy = interpolate(
    frame,
    [cursorIn, inputClick - 2, typeStart + 10, typeStart + 30, resultsIn + 8, resultClick - 4],
    [960, 200, 200, 300, 300, 450],
    { ...clamp, easing: ease.inOut },
  );
  const press =
    interpolate(frame, [inputClick - 2, inputClick, inputClick + 6], [0, 1, 0], clamp) +
    interpolate(frame, [resultClick - 2, resultClick, resultClick + 6], [0, 1, 0], clamp);

  const resultsP = interpolate(frame, [resultsIn, resultsIn + 26], [0, 1], { ...clamp, easing: ease.out });
  const hover = interpolate(frame, [resultClick - 16, resultClick - 6], [0, 1], clamp);
  const rowPress = interpolate(frame, [resultClick - 2, resultClick + 2, resultClick + 12], [0, 1, 0], clamp);

  const cardH = interpolate(resultsP, [0, 1], [312, 312 + 290]);

  // Exit: zoom through the chosen result
  const zoom = interpolate(frame, [exit, 240], [1, 5.5], {
    ...clamp,
    easing: ease.in,
    output: "perceptual-scale",
  });
  const exitBlur = interpolate(frame, [exit + 10, 240], [0, 24], clamp);
  const exitFade = interpolate(frame, [exit + 22, 240], [1, 0], clamp);

  const enter = interpolate(frame, [0, 34], [0, 1], { ...clamp, easing: ease.out });
  const tiltY = Math.sin(frame / 50) * 3;

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ opacity: exitFade, filter: `blur(${exitBlur}px)` }}>
        <div
          style={{
            position: "absolute",
            top: 420,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Words text="Find any show." accent={["show"]} start={10} stagger={6} size={84} out={exit - 6} />
        </div>

        <div
          style={{
            position: "absolute",
            left: (1080 - CARD_W) / 2,
            top: 720,
            width: CARD_W,
            transformOrigin: `${ROW.x + ROW.w / 2}px ${ROW.y + ROW.h / 2}px`,
            transform: `perspective(2200px) translateY(${(1 - enter) * 420}px) rotateX(${interpolate(enter, [0, 1], [34, 7]) * (1 - interpolate(frame, [exit - 20, exit], [0, 1], clamp))}deg) rotateY(${tiltY * (1 - interpolate(frame, [exit - 20, exit], [0, 1], clamp))}deg) scale(${interpolate(enter, [0, 1], [0.86, 1]) * zoom})`,
            opacity: enter,
          }}
        >
          <Card style={{ width: CARD_W, height: cardH, position: "relative", overflow: "hidden" }}>
            {/* header */}
            <div
              style={{
                position: "absolute",
                left: 44,
                right: 44,
                top: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Lockup size={46} />
              <div style={{ display: "flex", gap: 26, fontFamily: sans, fontSize: 30, color: C.ink2, fontWeight: 500 }}>
                <span>Explore</span>
                <span>Ratings</span>
              </div>
            </div>

            {/* search input */}
            <div
              style={{
                position: "absolute",
                left: 44,
                top: 136,
                width: 852,
                height: 128,
                borderRadius: 22,
                background: C.bg,
                border: `2px solid ${focused ? C.signal : C.line}`,
                boxShadow: focused ? `0 0 0 8px rgba(125,137,255,0.14)` : "none",
                display: "flex",
                alignItems: "center",
                paddingLeft: 104,
                fontFamily: sans,
                fontSize: 50,
                fontWeight: 500,
                color: C.ink,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={44}
                height={44}
                style={{ position: "absolute", left: 38, top: 42 }}
                fill="none"
                stroke={focused ? C.signal : C.ink2}
                strokeWidth={2.2}
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              {text ? (
                <span>{text}</span>
              ) : (
                <span style={{ color: C.ink3 }}>Search for a series</span>
              )}
              {focused && caretOn ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 4,
                    height: 58,
                    marginLeft: text ? 4 : -2,
                    background: C.signal,
                    borderRadius: 2,
                    order: text ? 0 : -1,
                  }}
                />
              ) : null}
            </div>

            {/* results */}
            <div
              style={{
                position: "absolute",
                left: 44,
                top: 300,
                fontFamily: sans,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 3,
                color: C.ink3,
                opacity: resultsP,
              }}
            >
              SERIES
            </div>
            <div
              style={{
                position: "absolute",
                left: ROW.x,
                top: ROW.y,
                width: ROW.w,
                height: ROW.h,
                borderRadius: 24,
                background: `rgba(125,137,255,${0.06 + hover * 0.08})`,
                border: `2px solid rgba(125,137,255,${hover * 0.5})`,
                display: "flex",
                alignItems: "center",
                gap: 34,
                padding: "0 30px",
                boxSizing: "border-box",
                opacity: resultsP,
                translate: `0px ${(1 - resultsP) * 40}px`,
                scale: String(1 - rowPress * 0.03),
              }}
            >
              <Poster w={120} h={172} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: display, fontSize: 64, color: C.ink, lineHeight: 1 }}>
                  The Mentalist
                </div>
                <div style={{ fontFamily: sans, fontSize: 30, color: C.ink2, marginTop: 14, fontWeight: 500 }}>
                  2008 – 2015 · 7 seasons
                </div>
                <div style={{ fontFamily: sans, fontSize: 26, color: C.ink3, marginTop: 6, fontWeight: 500 }}>
                  Crime · Drama
                </div>
              </div>
              <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke={C.ink2} strokeWidth={2.4}>
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Card>

          <Ripple x={420 + 8} y={200 + 6} at={inputClick} />
          <Ripple x={520 + 8} y={450 + 6} at={resultClick} />
          <Cursor
            x={cx}
            y={cy}
            press={press}
            hand={frame > resultsIn + 20}
            opacity={interpolate(frame, [cursorIn, cursorIn + 10], [0, 1], clamp)}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
