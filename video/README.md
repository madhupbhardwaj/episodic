# Tenbars product video

A ~28s, 1080×1920 @ 60fps promo for [tenbars.vercel.app](https://tenbars.vercel.app), built with [Remotion](https://remotion.dev).

## Commands

```bash
npm i
npm run studio     # preview in Remotion Studio
npm run render     # out/tenbars-9x16.mp4 (video + audio)
npm run still      # single frame (the 10/10 moment) to out/tenbars.png
npm run audio      # regenerate all music + SFX into public/audio (needs python3 + numpy)
npm run lint
```

## Structure

| Path | What |
| --- | --- |
| `src/Tenbars.tsx` | Main composition: scene sequences + every sound cue |
| `src/timeline.ts` | Single source of truth for scene and beat timings |
| `src/scenes/*` | One file per scene (Hook, Search, Show, Rate, LevelUp, Social, EndCard), also registered individually in Studio under *Tenbars-Scenes* |
| `src/components/ui.tsx` | Shared pieces: background, 10-bar meter, burst logo, cursor, particles, cards |
| `src/theme.ts` | Colors (site dark-mode tokens shifted to midnight blue) and fonts (Gloock + Schibsted Grotesk, bundled in `public/fonts`) |
| `scripts/make-audio.py` | Synthesizes the music bed and all SFX: royalty-free and in key |

## Sound design

Music is 120 BPM, so 1 beat = 30 frames. Every cut, the 10/10 impact (13.0s), the level-up (16.0s) and the logo hit (22.5s) land on a beat.
The ten rating bars are the ten notes of D-minor pentatonic: the hook plays them as a rising scale, and rating 1→10 replays the same notes into the drop.

To retime something, change it in `src/timeline.ts`. Visuals and sound cues both read from that file. If you move a beat-locked moment, also update the matching section times in `scripts/make-audio.py` (`plan`, drums, build/drop).
