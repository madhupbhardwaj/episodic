import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Same type pairing as tenbars.vercel.app, bundled locally so renders work offline.
export const display = "Gloock";
export const sans = "Schibsted Grotesk";

loadFont({
  family: display,
  url: staticFile("fonts/Gloock-Regular.woff2"),
  weight: "400",
});
// Schibsted Grotesk ships as a variable font (400–900)
loadFont({
  family: sans,
  url: staticFile("fonts/SchibstedGrotesk.woff2"),
  weight: "400 900",
});

// Tenbars dark-mode tokens, nudged toward a deep midnight blue.
export const C = {
  bg: "#090B16",
  bgGlow: "#18204A",
  surface: "#141726",
  surface2: "#1B1F33",
  line: "#2A2F48",
  ink: "#ECEDEF",
  ink2: "#9A9EB4",
  ink3: "#5D6380",
  signal: "#7D89FF", // site dark-mode accent
  signalDeep: "#2638E8", // logo blue, used only as glow
  signalInk: "#0C0D12",
  sunk: "rgba(236,237,239,0.13)",
};

export const FPS = 60;
export const W = 1080;
export const H = 1920;

// 120 BPM: 1 beat = 30 frames at 60fps
export const BEAT = 30;

export const LABELS = [
  "",
  "Awful",
  "Bad",
  "Poor",
  "Meh",
  "Okay",
  "Decent",
  "Good",
  "Great",
  "Superb",
  "Perfect",
];

// Logo burst, straight from the site (viewBox 0 0 32 32)
export const BURST_D =
  "M16.00 1.00 L19.52 5.16 L24.82 3.86 L25.22 9.30 L30.27 11.36 L27.40 16.00 L30.27 20.64 L25.22 22.70 L24.82 28.14 L19.52 26.84 L16.00 31.00 L12.48 26.84 L7.18 28.14 L6.78 22.70 L1.73 20.64 L4.60 16.00 L1.73 11.36 L6.78 9.30 L7.18 3.86 L12.48 5.16Z";

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
