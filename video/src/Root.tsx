import React from "react";
import { Composition, Folder } from "remotion";
import { Tenbars } from "./Tenbars";
import { Hook } from "./scenes/Hook";
import { Search } from "./scenes/Search";
import { Show } from "./scenes/Show";
import { Rate } from "./scenes/Rate";
import { LevelUp } from "./scenes/LevelUp";
import { Social } from "./scenes/Social";
import { EndCard } from "./scenes/EndCard";
import { SCENES, TOTAL_FRAMES } from "./timeline";
import { FPS, H, W } from "./theme";

const scenes = [
  ["Hook", Hook, SCENES.hook.duration],
  ["Search", Search, SCENES.search.duration],
  ["Show", Show, SCENES.show.duration],
  ["Rate", Rate, SCENES.rate.duration],
  ["LevelUp", LevelUp, SCENES.level.duration],
  ["Social", Social, SCENES.social.duration],
  ["EndCard", EndCard, SCENES.end.duration],
] as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Tenbars"
        component={Tenbars}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={W}
        height={H}
      />
      <Folder name="Tenbars-Scenes">
        {scenes.map(([id, component, duration]) => (
          <Composition
            key={id}
            id={id}
            component={component}
            durationInFrames={duration}
            fps={FPS}
            width={W}
            height={H}
          />
        ))}
      </Folder>
    </>
  );
};
