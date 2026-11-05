import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Bars, Burst, Card, Cursor, Ripple, Words, ease } from "../components/ui";
import { SOCIAL } from "../timeline";
import { C, LABELS, clamp, display, sans } from "../theme";

const FRIENDS = [
  { handle: "@nightowl", score: 9, color: "#E0715A", x: 36, y: 1290, rot: -6, z: 0 },
  { handle: "@plottwist", score: 8, color: "#4FB39A", x: 584, y: 1250, rot: 5, z: 1 },
  { handle: "@bingequeen", score: 10, color: "#D9A441", x: 300, y: 1560, rot: -2, z: 2 },
];

const SHARE_BTN = { x: 540, y: 1105 };

export const Social: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 28], [0, 1], { ...clamp, easing: ease.out });
  const press = interpolate(frame, [SOCIAL.shareClick - 3, SOCIAL.shareClick, SOCIAL.shareClick + 8], [0, 1, 0], clamp);
  const toast = interpolate(frame, [SOCIAL.toastIn, SOCIAL.toastIn + 18, 108, 122], [0, 1, 1, 0], {
    ...clamp,
    easing: [ease.spring, ease.soft, ease.in],
  });
  const settle = interpolate(frame, [SOCIAL.friends[0] - 12, SOCIAL.friends[2] + 10], [0, 1], { ...clamp, easing: ease.inOut });
  const collapse = interpolate(frame, [SOCIAL.collapse, 240], [0, 1], { ...clamp, easing: ease.in });
  const drift = Math.sin(frame / 36);

  const cx = interpolate(frame, [SOCIAL.cursorIn, SOCIAL.shareClick - 3, SOCIAL.shareClick + 20, SOCIAL.shareClick + 40], [960, SHARE_BTN.x - 6, SHARE_BTN.x + 120, 1000], { ...clamp, easing: ease.inOut });
  const cy = interpolate(frame, [SOCIAL.cursorIn, SOCIAL.shareClick - 3, SOCIAL.shareClick + 20, SOCIAL.shareClick + 40], [1700, SHARE_BTN.y - 8, SHARE_BTN.y + 120, 1900], { ...clamp, easing: ease.inOut });

  // whole group gets pulled into the center at the end (becomes the logo)
  const pull = (x: number, y: number) =>
    `${(540 - x) * collapse}px ${(960 - y) * collapse}px`;

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          translate: `${(1 - enter) * 1100}px 0px`,
          filter: `blur(${(1 - enter) * 20 + collapse * 10}px)`,
          opacity: 1 - interpolate(frame, [228, 240], [0, 1], clamp),
        }}
      >
        <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", translate: pull(540, 280), scale: String(1 - collapse) }}>
          <Words text={"See what your\nfriends think."} accent={["friends"]} start={SOCIAL.captionIn} stagger={6} size={82} />
        </div>

        {/* toast */}
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: toast,
            translate: `0px ${(1 - toast) * -120}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "24px 36px",
              borderRadius: 999,
              background: C.ink,
              color: C.signalInk,
              fontFamily: sans,
              fontSize: 32,
              fontWeight: 600,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke={C.signalDeep} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Link copied
            <span style={{ color: "#5A5E66", fontWeight: 500 }}>tenbars.vercel.app/@tenbars</span>
          </div>
        </div>

        {/* profile card */}
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 470,
            transformOrigin: "430px 360px",
            transform: `perspective(2200px) rotateX(${4 + drift * 1.5}deg) rotateY(${-drift * 3}deg) scale(${interpolate(settle, [0, 1], [1, 0.9]) * (1 - collapse)})`,
            translate: `${(540 - 540) * collapse}px ${interpolate(settle, [0, 1], [0, -40]) + (960 - 830) * collapse}px`,
          }}
        >
          <Card style={{ width: 860, height: 740, position: "relative" }}>
            <div style={{ position: "absolute", top: 60, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 999,
                  background: `radial-gradient(circle at 30% 25%, #4A57F0 0%, ${C.signalDeep} 55%, #101A8A 100%)`,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 0 6px rgba(125,137,255,0.25)",
                }}
              >
                <Burst size={92} color="#fff" />
              </div>
              <div style={{ fontFamily: display, fontSize: 84, color: C.ink, marginTop: 30, lineHeight: 1 }}>@tenbars</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
                <Burst size={52} color={C.signal}>
                  <span style={{ fontFamily: sans, fontSize: 24, fontWeight: 800, color: C.signalInk }}>2</span>
                </Burst>
                <span style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: C.ink2 }}>Regular</span>
              </div>
              <div style={{ display: "flex", gap: 70, marginTop: 40 }}>
                {[
                  ["20", "episodes"],
                  ["8.1", "avg score"],
                  ["1", "show"],
                ].map(([n, l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: display, fontSize: 60, color: C.ink, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontFamily: sans, fontSize: 26, color: C.ink3, marginTop: 6, fontWeight: 500 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          {/* share button */}
          <div
            style={{
              position: "absolute",
              left: 430 - 200,
              top: 590,
              width: 400,
              height: 104,
              borderRadius: 999,
              background: C.signal,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              fontFamily: sans,
              fontSize: 36,
              fontWeight: 700,
              color: C.signalInk,
              scale: String(1 - press * 0.08),
              boxShadow: `0 0 ${30 + press * 40}px rgba(125,137,255,${0.4 + press * 0.4})`,
            }}
          >
            <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke={C.signalInk} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
            </svg>
            Share profile
          </div>
        </div>

        {/* friends */}
        {FRIENDS.map((f, i) => {
          const at = SOCIAL.friends[i];
          const p = interpolate(frame, [at - 14, at + 4], [0, 1], { ...clamp, easing: ease.out });
          const land = interpolate(frame, [at, at + 5, at + 20], [0, 0.06, 0], clamp);
          const fromX = i === 0 ? -700 : i === 1 ? 800 : 0;
          const fromY = i === 2 ? 700 : 200;
          const float = Math.sin((frame + i * 40) / 30) * 10;
          return (
            <div
              key={f.handle}
              style={{
                position: "absolute",
                left: f.x,
                top: f.y,
                zIndex: 5 + f.z,
                opacity: p,
                translate: `${fromX * (1 - p) + (540 - (f.x + 230)) * collapse}px ${fromY * (1 - p) + float + (960 - (f.y + 120)) * collapse}px`,
                transform: `perspective(1600px) rotate(${f.rot * p}deg) rotateY(${(1 - p) * (i === 0 ? 50 : -50)}deg) scale(${(0.85 + p * 0.15 + land) * (1 - collapse * 0.9)})`,
              }}
            >
              <Card style={{ width: 460, height: 240, borderRadius: 30, position: "relative" }}>
                <div style={{ position: "absolute", left: 30, top: 28, display: "flex", alignItems: "center", gap: 18 }}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 999,
                      background: f.color,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: display,
                      fontSize: 36,
                      color: "#fff",
                    }}
                  >
                    {f.handle[1].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 700, color: C.ink }}>{f.handle}</div>
                    <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 500, color: C.ink3, marginTop: 2 }}>
                      The Mentalist · S1 E23
                    </div>
                  </div>
                </div>
                <div style={{ position: "absolute", left: 30, right: 30, bottom: 30, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <Bars width={220} height={62} gap={6} radius={3} minRatio={0.3} fill={(b) => (b < f.score ? interpolate(frame, [at + b * 1.5, at + b * 1.5 + 6], [0, 1], clamp) : 0)} />
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: display, fontSize: 70, color: C.ink, lineHeight: 0.9 }}>{f.score}</span>
                    <span style={{ fontFamily: sans, fontSize: 24, fontWeight: 600, color: C.ink2 }}>{LABELS[f.score]}</span>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        <Ripple x={SHARE_BTN.x} y={SHARE_BTN.y} at={SOCIAL.shareClick} />
        <Cursor x={cx} y={cy} press={press} hand opacity={interpolate(frame, [SOCIAL.cursorIn, SOCIAL.cursorIn + 10], [0, 1], clamp)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
