import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Bars, Words, ease } from "../components/ui";
import { HOOK } from "../timeline";
import { clamp } from "../theme";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background glow={interpolate(frame, [0, 60], [0, 1], clamp)} />
      <AbsoluteFill
        style={{
          scale: String(
            interpolate(frame, [0, HOOK.exit, 150], [1.04, 1, 2.6], {
              ...clamp,
              easing: [ease.soft, ease.in],
              output: "perceptual-scale",
            }),
          ),
          opacity: interpolate(frame, [HOOK.exit + 8, 150], [1, 0], clamp),
          filter: `blur(${interpolate(frame, [HOOK.exit, 150], [0, 18], { ...clamp, easing: ease.in })}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Words
            text={"Every episode\ndeserves a score."}
            accent={["score"]}
            start={46}
            stagger={7}
            size={112}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 1010,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Bars
            width={720}
            height={440}
            gap={20}
            radius={10}
            rise={(i) =>
              interpolate(
                frame,
                [HOOK.barStart + i * HOOK.barStep, HOOK.barStart + i * HOOK.barStep + 22],
                [0, 1],
                { ...clamp, easing: ease.spring },
              )
            }
            fill={(i) =>
              interpolate(
                frame,
                [HOOK.barStart + i * HOOK.barStep + 2, HOOK.barStart + i * HOOK.barStep + 14],
                [0, 1],
                clamp,
              )
            }
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
