import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Hook } from "./scenes/Hook";
import { Search } from "./scenes/Search";
import { Show, ROW_H, scrollAt } from "./scenes/Show";
import { Rate } from "./scenes/Rate";
import { LevelUp } from "./scenes/LevelUp";
import { Social } from "./scenes/Social";
import { EndCard } from "./scenes/EndCard";
import { END, HOOK, LEVEL, RATE, RATE_IMPACT, SCENES, SEARCH, SHOW, SOCIAL } from "./timeline";

type Cue = { at: number; src: string; volume: number };

const sfx = (name: string) => staticFile(`audio/${name}.wav`);

const buildCues = (): Cue[] => {
  const c: Cue[] = [];
  const add = (at: number, name: string, volume: number) => c.push({ at, src: sfx(name), volume });

  // 1. Hook: each bar rising plays its note in the scale
  const h = SCENES.hook.from;
  for (let i = 0; i < 10; i++) add(h + HOOK.barStart + i * HOOK.barStep, `bar-${i + 1}`, 0.42);
  add(h + 46 + 4 * 7, "pop-d", 0.3);
  add(h + HOOK.exit - 4, "whoosh-long", 0.5);

  // 2. Search
  const s = SCENES.search.from;
  add(s + 18, "drop-in", 0.55);
  add(s + SEARCH.inputClick, "click", 0.6);
  for (let i = 0; i < SEARCH.query.length; i++) {
    if (SEARCH.query[i] === " ") continue;
    add(s + SEARCH.typeStart + i * SEARCH.typeStep, `key-${(i * 3) % 5 + 1}`, 0.5);
  }
  add(s + SEARCH.resultsIn + 4, "pop-a", 0.32);
  add(s + SEARCH.resultClick, "click", 0.6);
  add(s + SEARCH.exit + 4, "whip", 0.55);

  // 3. Show page
  const sh = SCENES.show.from;
  add(sh + 30, "drop-in", 0.45);
  add(sh + SHOW.seasonClick, "click", 0.55);
  let lastRow = 0;
  for (let f = SHOW.scrollStart; f <= SHOW.scrollEnd; f++) {
    const row = Math.floor((scrollAt(f) + 60) / ROW_H);
    if (row !== lastRow) {
      add(sh + f, "scroll-tick", 0.22);
      lastRow = row;
    }
  }
  add(sh + SHOW.e23Flash, "pop-d", 0.4);
  add(sh + SHOW.rowClick, "click", 0.6);
  add(sh + SHOW.exit + 2, "whoosh", 0.5);

  // 4. Rating 1 -> 10: same notes as the hook, ending on the impact
  const r = SCENES.rate.from;
  add(r + 14, "drop-in", 0.5);
  for (let i = 0; i < 9; i++) add(r + RATE.fillStart + i * RATE.fillStep, `bar-${i + 1}`, 0.5);
  add(r + RATE_IMPACT, "bar-10", 0.55);
  add(r + RATE_IMPACT, "impact", 0.95);
  add(r + RATE.exit - 2, "whoosh", 0.35);

  // 5. Level up
  const l = SCENES.level.from;
  add(l + LEVEL.countTick, "tick", 0.5);
  add(l + LEVEL.levelUp - 96, "riser", 0.32);
  add(l + LEVEL.levelUp, "levelup", 0.85);
  add(l + LEVEL.exit + 2, "whip", 0.5);

  // 6. Social
  const so = SCENES.social.from;
  add(so + SOCIAL.shareClick, "click", 0.6);
  add(so + SOCIAL.toastIn, "chime", 0.45);
  ["pop-a", "pop-d", "pop-f"].forEach((p, i) => add(so + SOCIAL.friends[i], p, 0.55));
  add(SCENES.end.from - 96, "riser", 0.55);

  // 7. End card
  const e = SCENES.end.from;
  add(e + END.hit, "logo-hit", 0.95);
  for (let i = 0; i < 10; i++) add(e + END.tagline + 24 + i * 3, `bar-${i + 1}`, 0.16);
  add(e + END.url, "pop-f", 0.25);

  return c;
};

const CUES = buildCues();

export const Tenbars: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#090B16" }}>
      <Sequence name="Hook" from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <Hook />
      </Sequence>
      <Sequence name="Search" from={SCENES.search.from} durationInFrames={SCENES.search.duration}>
        <Search />
      </Sequence>
      <Sequence name="Show" from={SCENES.show.from} durationInFrames={SCENES.show.duration}>
        <Show />
      </Sequence>
      <Sequence name="Rate" from={SCENES.rate.from} durationInFrames={SCENES.rate.duration}>
        <Rate />
      </Sequence>
      <Sequence name="Level up" from={SCENES.level.from} durationInFrames={SCENES.level.duration}>
        <LevelUp />
      </Sequence>
      <Sequence name="Social" from={SCENES.social.from} durationInFrames={SCENES.social.duration}>
        <Social />
      </Sequence>
      <Sequence name="End card" from={SCENES.end.from} durationInFrames={SCENES.end.duration}>
        <EndCard />
      </Sequence>

      <Audio name="Music" src={staticFile("audio/music.wav")} volume={0.62} />
      {CUES.map((cue, i) => (
        <Audio key={i} name={cue.src.split("/").pop()} from={cue.at} src={cue.src} volume={cue.volume} />
      ))}
    </AbsoluteFill>
  );
};
