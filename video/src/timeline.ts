// Scene layout on the global timeline (frames @ 60fps, 30 frames = 1 beat @ 120 BPM).
// Every scene boundary lands on a beat so the music and cuts stay locked.
export const SCENES = {
  hook: { from: 0, duration: 150 },
  search: { from: 150, duration: 240 },
  show: { from: 390, duration: 240 },
  rate: { from: 630, duration: 270 },
  level: { from: 900, duration: 210 },
  social: { from: 1110, duration: 240 },
  end: { from: 1350, duration: 330 },
} as const;

export const TOTAL_FRAMES = 1680; // 28s

// ---- Local scene timings shared by visuals and sound design ----

export const HOOK = {
  barStart: 8,
  barStep: 7, // bar i rises at barStart + i * barStep
  exit: 128,
};

export const SEARCH = {
  cardIn: 0,
  cursorIn: 18,
  inputClick: 46,
  typeStart: 58,
  typeStep: 5, // frames per character
  query: "The Mentalist",
  resultsIn: 132,
  resultClick: 176,
  exit: 196,
};

export const SHOW = {
  seasonClick: 52,
  scrollStart: 66,
  scrollEnd: 150,
  e23Flash: 150,
  rowClick: 196,
  exit: 212,
};

export const RATE = {
  cursorIn: 24,
  fillStart: 60,
  fillStep: 10, // bar i fills at fillStart + i * fillStep; bar 10 at 150 (global 780 = 13.0s, on the beat)
  exit: 248,
};
export const RATE_IMPACT = RATE.fillStart + 9 * RATE.fillStep;

export const LEVEL = {
  countTick: 24,
  fillStart: 24,
  fillEnd: 56,
  levelUp: 60, // global 960 = 16.0s
  captionIn: 110,
  exit: 186,
};

export const SOCIAL = {
  cursorIn: 14,
  shareClick: 45, // global 1155, on an 8th
  toastIn: 50,
  friends: [75, 90, 105], // globals 1185 / 1200 / 1215, on 8ths
  captionIn: 120,
  collapse: 204,
};

export const END = {
  hit: 0, // global 1350 = 22.5s
  wordmark: 22,
  tagline: 54,
  url: 96,
  fadeOut: 290,
};
