"""
Synthesizes every sound in the Tenbars promo: the music bed and all SFX.

Everything is generated from code so it is royalty-free and locked to the
video's timeline. The video runs at 60fps on a 120 BPM grid (1 beat = 0.5s
= 30 frames), so scene cuts, the 10/10 impact and the level-up land on beats.

Sonic identity: the ten rating bars are ten notes of D minor pentatonic.
They play as an ascending scale in the hook and again when the user rates
1 -> 10, so the SFX are literally in key with the music.

Usage:  python3 scripts/make-audio.py   (writes into public/audio/)
"""

import os
import wave

import numpy as np

SR = 48000
BPM = 120
BEAT = 60 / BPM
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(10)


# ---------------------------------------------------------------- helpers

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(dur, decay, attack=0.002):
    t = t_axis(dur)
    a = np.clip(t / max(attack, 1e-5), 0, 1)
    return a * np.exp(-t / decay)


def adsr(dur, a, d, s, r):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / d, e)
    e = np.where(t >= a + d, s, e)
    rel_start = dur - r
    e = np.where(t > rel_start, e * np.clip((dur - t) / r, 0, 1), e)
    return e


def fft_filter(x, lo=None, hi=None, slope=1.0):
    """Smooth zero-phase band filter applied in the frequency domain."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi is not None:
        g *= 1 / (1 + (f / hi) ** (4 * slope))
    if lo is not None:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    return np.fft.irfft(X * g, n)


def svf_sweep(x, f_start, f_end, q=0.7, mode="bp", curve=1.0):
    """Time-varying state-variable filter (Chamberlin). For short SFX."""
    n = len(x)
    p = np.linspace(0, 1, n) ** curve
    freqs = f_start * (f_end / f_start) ** p
    fc = 2 * np.sin(np.pi * np.minimum(freqs, SR / 6) / SR)
    damp = 1 / q
    low = band = 0.0
    out = np.empty(n)
    for i in range(n):
        f = fc[i]
        low += f * band
        high = x[i] - low - damp * band
        band += f * high
        out[i] = band if mode == "bp" else (low if mode == "lp" else high)
    return out


def saw(freq, dur, detune_cents=0.0, phase=None):
    t = t_axis(dur)
    f = freq * 2 ** (detune_cents / 1200)
    ph = (f * t + (rng.random() if phase is None else phase)) % 1.0
    return 2 * ph - 1


def bell(freq, dur, decay=0.6, bright=1.0, index=2.2):
    """Glassy FM bell: the signature 'bar' tone."""
    t = t_axis(dur)
    mod_env = np.exp(-t / (decay * 0.35))
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * index * bright * mod_env
    car = np.sin(2 * np.pi * freq * t + mod)
    sub = 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t / (decay * 0.5))
    return (car + sub) * env_exp(dur, decay, 0.0015)


def pluck(freq, dur, decay=0.25):
    t = t_axis(dur)
    tri = 2 * np.abs(2 * ((freq * t) % 1) - 1) - 1
    s = 0.6 * tri + 0.4 * np.sin(2 * np.pi * freq * t)
    return s * env_exp(dur, decay, 0.003)


def reverb_ir(seconds=2.4, decay=0.55, bright=7000, seed=3):
    r = np.random.default_rng(seed)
    t = t_axis(seconds)
    irs = []
    for _ in range(2):
        noise = r.standard_normal(len(t)) * np.exp(-t / decay)
        noise = fft_filter(noise, lo=180, hi=bright)
        irs.append(noise / np.max(np.abs(noise)))
    return np.stack(irs, axis=1)


IR_ROOM = reverb_ir(2.6, 0.62)
IR_SHORT = reverb_ir(1.0, 0.18, bright=9000, seed=5)


def convolve(x, ir):
    """Mono x (n,) convolved with stereo ir (m,2) -> stereo (n+m-1, 2)."""
    n = len(x) + len(ir) - 1
    N = 1 << (n - 1).bit_length()
    X = np.fft.rfft(x, N)
    out = np.stack([np.fft.irfft(X * np.fft.rfft(ir[:, c], N), N)[:n] for c in range(2)], axis=1)
    return out


def wet(x, ir=IR_ROOM, mix=0.25, width=0.0):
    """Mono -> stereo with reverb tail."""
    dry = np.stack([x, x], axis=1)
    tail = convolve(x, ir)
    tail *= np.max(np.abs(x)) / (np.max(np.abs(tail)) + 1e-9)
    out = np.zeros_like(tail)
    out[: len(dry)] += dry * (1 - mix * 0.5)
    out += tail * mix
    return out


def stereoize(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], axis=1)


def place(buf, x, at):
    """Mix stereo/mono x into stereo buf at time 'at' seconds."""
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    i = int(round(at * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i]


def trim_silence(x, thresh=1e-4):
    mag = np.max(np.abs(x), axis=1) if x.ndim == 2 else np.abs(x)
    idx = np.where(mag > thresh)[0]
    return x[: idx[-1] + 1] if len(idx) else x


def write(name, x, peak=0.89):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = trim_silence(x)
    fade = min(len(x), int(0.004 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"  {name:22s} {len(x) / SR:6.2f}s")


# ---------------------------------------------------------------- SFX

# D minor pentatonic, one note per rating bar (bar 1 = D4 ... bar 10 = C6)
BAR_NOTES = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]


def sfx_bar_note(i):
    f = midi(BAR_NOTES[i])
    s = bell(f, 1.6, decay=0.45 + 0.02 * i, bright=0.8, index=1.6) * 0.8
    p = pluck(f / 2, 0.5, 0.12)
    s[: len(p)] += 0.25 * p
    return wet(s, IR_ROOM, 0.32)


def sfx_whoosh(dur=0.55, f0=300, f1=5200, curve=1.6, reverse=False):
    n = rng.standard_normal(int(dur * SR))
    t = t_axis(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    peak_at = 0.62
    e = np.where(t / dur < peak_at, (t / dur / peak_at) ** 2.2, np.exp(-(t / dur - peak_at) * 9))
    s = svf_sweep(n, f0, f1, q=1.4, mode="bp", curve=curve) * e
    s += 0.35 * svf_sweep(n, f0 * 0.5, f1 * 0.4, q=0.8, mode="lp", curve=curve) * e
    if reverse:
        s = s[::-1]
    l = s
    r = np.roll(s, int(0.006 * SR))
    st = np.stack([l, r], axis=1)
    return st


def sfx_click():
    t = t_axis(0.08)
    tick = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * 520 * t) * np.exp(-t / 0.018) * 0.6
    noise = fft_filter(rng.standard_normal(len(t)), lo=2000, hi=9000) * np.exp(-t / 0.003) * 0.5
    return wet(tick * 0.6 + body + noise, IR_SHORT, 0.12)


def sfx_key(v):
    t = t_axis(0.09)
    r = np.random.default_rng(100 + v)
    pitch = 1 + 0.12 * (v - 2)
    noise = fft_filter(r.standard_normal(len(t)), lo=1200 * pitch, hi=7000 * pitch) * np.exp(-t / 0.007)
    thock = np.sin(2 * np.pi * 210 * pitch * t) * np.exp(-t / 0.02) * 0.7
    tap = np.sin(2 * np.pi * 1700 * pitch * t) * np.exp(-t / 0.004) * 0.3
    return wet(noise + thock + tap, IR_SHORT, 0.1)


def sfx_tick(freq=1900):
    t = t_axis(0.12)
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.018)
    s += 0.4 * np.sin(2 * np.pi * freq * 2.7 * t) * np.exp(-t / 0.006)
    return wet(s, IR_SHORT, 0.15)


def sfx_pop(freq):
    """Bubbly pitched pop: upward sine chirp + bell body in key."""
    t = t_axis(0.5)
    sweep = freq * 0.55 * (1 + 0.9 * (1 - np.exp(-t / 0.012)))
    ph = 2 * np.pi * np.cumsum(sweep) / SR
    pop = np.sin(ph) * np.exp(-t / 0.05)
    s = pop + 0.55 * bell(freq, 0.5, 0.18, 0.6, 1.2)
    return wet(s, IR_ROOM, 0.22)


def sfx_drop_in():
    """Soft 'card lands' thud + air."""
    t = t_axis(0.35)
    f = 140 * np.exp(-t / 0.08) + 55
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    air = fft_filter(rng.standard_normal(len(t)), lo=800, hi=5000) * np.exp(-t / 0.03) * 0.15
    return wet(s + air, IR_SHORT, 0.15)


def sfx_impact():
    """The 10/10 moment: sub drop, punch, glassy chord and sparkles."""
    dur = 3.5
    t = t_axis(dur)
    f = 95 * np.exp(-t / 0.15) + 38
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    punch = fft_filter(rng.standard_normal(len(t)), hi=1800) * np.exp(-t / 0.05) * 0.8
    crack = fft_filter(rng.standard_normal(len(t)), lo=3000) * np.exp(-t / 0.02) * 0.4
    chord = sum(bell(midi(n), dur, 1.3, 0.9, 1.8) for n in [74, 81, 86, 89, 93]) * 0.28
    sparkle = np.zeros(len(t))
    for k in range(18):
        at = 0.04 + k * 0.045 + rng.random() * 0.03
        nn = BAR_NOTES[rng.integers(4, 10)] + 12
        g = bell(midi(nn), 0.6, 0.15, 0.5, 1.0) * (0.22 * (1 - k / 20))
        i = int(at * SR)
        sparkle[i:i + len(g)] += g[: len(sparkle) - i]
    mono = sub * 1.1 + punch + crack + chord + sparkle
    st = wet(mono, IR_ROOM, 0.38)
    return st


def sfx_levelup():
    """Ascending arpeggio + shimmer + badge pop."""
    dur = 2.8
    buf = np.zeros((int(dur * SR) + SR * 3, 2))
    arp = [62, 69, 74, 77, 81, 86]
    for k, n in enumerate(arp):
        s = bell(midi(n), 1.6, 0.5, 0.9, 1.6) * (0.7 + 0.06 * k)
        place(buf, stereoize(s, -0.5 + k * 0.2), k * BEAT / 4 * 0.5)
    # shimmer: high trill
    for k in range(10):
        n = [86, 89, 93, 89][k % 4]
        s = bell(midi(n), 0.4, 0.12, 0.4, 0.8) * 0.18 * (1 - k / 12)
        place(buf, stereoize(s, 0.6 if k % 2 else -0.6), 0.36 + k * 0.05)
    place(buf, sfx_pop(midi(74)) * 0.9, 0.0)
    mono = buf.mean(axis=1)
    return wet(mono, IR_ROOM, 0.35) * 0.7 + np.pad(buf, ((0, len(IR_ROOM) - 1), (0, 0)))[: len(buf) + len(IR_ROOM) - 1] * 0.5


def sfx_chime():
    """'Link copied' two-note chime."""
    buf = np.zeros(int(1.6 * SR))
    for k, n in enumerate([81, 86]):
        s = bell(midi(n), 1.2, 0.35, 0.7, 1.4) * 0.8
        i = int(k * 0.09 * SR)
        buf[i:i + len(s)] += s[: len(buf) - i]
    return wet(buf, IR_ROOM, 0.3)


def sfx_riser(dur=1.6):
    n = rng.standard_normal(int(dur * SR))
    t = t_axis(dur)
    e = (t / dur) ** 2.4
    s = svf_sweep(n, 200, 9000, q=2.2, mode="bp", curve=1.3) * e
    tone_f = 110 * 2 ** (3 * (t / dur) ** 1.5)
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * e * 0.25
    st = np.stack([s + tone, np.roll(s, 300) + tone], axis=1)
    return st


def sfx_logo_hit():
    dur = 4.5
    t = t_axis(dur)
    f = 80 * np.exp(-t / 0.2) + 36
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    chord = sum(bell(midi(n), dur, 1.8, 0.7, 1.4) for n in [65, 72, 76, 79, 84]) * 0.22
    air = fft_filter(rng.standard_normal(len(t)), lo=4000) * np.exp(-t / 0.4) * 0.12
    return wet(sub + chord + air, IR_ROOM, 0.45)


def sfx_scroll_tick():
    t = t_axis(0.05)
    s = np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.004)
    s += fft_filter(rng.standard_normal(len(t)), lo=2500, hi=8000) * np.exp(-t / 0.002) * 0.4
    return s


# ---------------------------------------------------------------- music

TOTAL = 28.0


def pad_chord(notes, dur, bright=1.0):
    out = np.zeros(int(dur * SR))
    for n in notes:
        for d in (-9, 0, 8):
            out += saw(midi(n), dur, d) * 0.33
    dark = fft_filter(out, hi=650 + 400 * bright, slope=0.6)
    return dark * adsr(dur, 0.35, 0.4, 0.85, 0.5)


def music():
    n = int(TOTAL * SR)
    pad = np.zeros(n)
    bass = np.zeros(n)
    drums = np.zeros(n)
    arp = np.zeros(n)
    duck = np.ones(n)

    def put(dst, x, at, gain=1.0):
        i = int(round(at * SR))
        if i >= n:
            return
        j = min(n, i + len(x))
        dst[i:j] += x[: j - i] * gain

    DM9 = [50, 53, 57, 60, 64]
    BB = [46, 50, 53, 57, 60]
    FM7 = [53, 57, 60, 64, 67]
    CADD9 = [48, 52, 55, 62, 67]
    FMAJ9 = [41, 53, 57, 64, 67, 72]
    roots = {id(DM9): 38, id(BB): 34, id(FM7): 41, id(CADD9): 36}

    # chord timeline (start, chord, length, brightness)
    plan = [
        (0.0, DM9, 2.5, 0.3),
        (2.5, DM9, 2.0, 0.6), (4.5, BB, 2.0, 0.6), (6.5, FM7, 2.0, 0.7), (8.5, CADD9, 2.0, 0.8),
        (10.5, BB, 2.5, 1.0),
        (13.0, DM9, 2.0, 1.6), (15.0, BB, 2.0, 1.6), (17.0, FM7, 2.0, 1.7), (19.0, CADD9, 2.0, 1.7),
        (21.0, DM9, 1.5, 1.5),
    ]
    for start, ch, ln, br in plan:
        g = 0.9 if start > 0 else 0.7
        put(pad, pad_chord(ch, ln + 0.6, br), start, g)
    # outro: resolve to F major 9, long and open
    put(pad, pad_chord(FMAJ9, 5.5, 1.2) * adsr(5.5, 0.05, 0.5, 0.9, 3.0), 22.5, 1.0)

    # bass: syncopated 8ths on roots during groove sections
    def bass_note(f, ln):
        t = t_axis(ln)
        s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
        s = np.tanh(1.6 * s)
        return s * adsr(ln, 0.005, 0.08, 0.7, 0.05)

    pattern = [0, 0.75, 1.5, 2.0, 2.75, 3.5]  # in beats, over 2 beats*2
    for start, ch, ln, br in plan:
        if start < 2.5 or start >= 21.0 and start != 21.0:
            continue
        root = midi(roots[id(ch)])
        if start == 10.5:
            # build: long held note
            put(bass, bass_note(root, 1.45), start, 0.8)
            continue
        for p in pattern:
            at = start + p * BEAT
            if at >= start + ln:
                break
            put(bass, bass_note(root * (2 if p == 2.75 else 1), BEAT * 0.6), at, 0.85)
    put(bass, bass_note(midi(29), 4.0) * np.exp(-t_axis(4.0) / 1.5), 22.5, 0.9)  # F1 under the logo

    # drums
    def kick():
        t = t_axis(0.45)
        f = 140 * np.exp(-t / 0.035) + 46
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
        s += fft_filter(rng.standard_normal(len(t)), lo=1500) * np.exp(-t / 0.003) * 0.15
        return s

    def hat(open_=False):
        t = t_axis(0.25 if open_ else 0.07)
        s = fft_filter(rng.standard_normal(len(t)), lo=7000) * np.exp(-t / (0.06 if open_ else 0.012))
        return s

    def clap():
        t = t_axis(0.4)
        nz = fft_filter(rng.standard_normal(len(t)), lo=900, hi=5000)
        e = np.zeros(len(t))
        for o in (0, 0.009, 0.018):
            e += np.where(t >= o, np.exp(-(t - o) / 0.01), 0) * 0.5
        e += np.where(t >= 0.025, np.exp(-(t - 0.025) / 0.12), 0)
        return nz * e

    K, CL = kick(), clap()

    def duck_at(at, depth=0.55, rel=0.22):
        i = int(at * SR)
        ln = int(rel * SR)
        if i >= n:
            return
        curve = 1 - depth * np.exp(-np.arange(ln) / (ln / 4))
        j = min(n, i + ln)
        duck[i:j] = np.minimum(duck[i:j], curve[: j - i])

    # groove 1: 2.5 -> 12.0  (soft four-on-the-floor + offbeat hats)
    b = 2.5
    while b < 12.0 - 1e-6:
        put(drums, K, b, 0.75)
        duck_at(b, 0.35)
        put(drums, hat(), b + BEAT / 2, 0.22)
        b += BEAT
    # build: snare roll 12.0 -> 13.0 accelerating + pad swell (handled by plan brightness)
    roll_t = 12.0
    step = BEAT / 2
    while roll_t < 12.97:
        prog = (roll_t - 12.0)
        put(drums, CL * 0.5, roll_t, 0.18 + 0.5 * prog)
        step = BEAT / 2 if prog < 0.5 else BEAT / 4
        if prog > 0.75:
            step = BEAT / 8
        roll_t += step
    # drop: 13.0 -> 22.5 full groove
    b = 13.0
    k = 0
    while b < 22.5 - 1e-6:
        put(drums, K, b, 1.0)
        duck_at(b, 0.6)
        if k % 2 == 1:
            put(drums, CL, b, 0.55)
        for s16 in range(4):
            put(drums, hat(open_=(s16 == 2)), b + s16 * BEAT / 4, 0.16 if s16 != 2 else 0.2)
        b += BEAT
        k += 1

    # arpeggio (D minor pentatonic) in the drop, quiet, 16ths
    arp_seq = [62, 69, 72, 74, 77, 74, 72, 69]
    chord_shift = {13.0: 0, 15.0: -4, 17.0: 3, 19.0: -2, 21.0: 0}
    t16 = 13.0
    idx = 0
    while t16 < 22.4:
        sec = max(k for k in chord_shift if k <= t16 + 1e-9)
        nn = arp_seq[idx % len(arp_seq)] + 12 + (0 if chord_shift[sec] == 0 else 0)
        put(arp, pluck(midi(nn), 0.3, 0.07), t16, 0.22)
        t16 += BEAT / 4
        idx += 1

    # stereo mix
    pad_st = wet(pad, IR_ROOM, 0.35)[:n] * duck[:, None]
    arp_st = wet(arp, IR_ROOM, 0.4)[:n]
    arp_st[:, 0] *= 0.8
    mix = np.zeros((n, 2))
    mix += pad_st * 0.42
    mix += np.stack([bass, bass], axis=1) * 0.38
    mix += wet(drums, IR_SHORT, 0.12)[:n] * 0.55
    mix += arp_st * 0.55

    # master envelope: fade in, gap before drop, fade out
    t = t_axis(TOTAL)
    master = np.clip(t / 1.2, 0, 1)
    gap = 1 - 0.75 * np.clip((t - 12.88) / 0.08, 0, 1) * (t < 13.0)
    master *= gap
    master *= np.clip((TOTAL - t) / 2.2, 0, 1)
    mix *= master[:, None]
    mix = np.tanh(mix * 1.2) / 1.2
    return mix


# ---------------------------------------------------------------- main

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("SFX:")
    for i in range(10):
        write(f"bar-{i + 1}.wav", sfx_bar_note(i), 0.8)
    write("whoosh.wav", sfx_whoosh(0.55, 250, 6000), 0.8)
    write("whoosh-long.wav", sfx_whoosh(0.9, 150, 4500, 1.2), 0.8)
    write("whip.wav", sfx_whoosh(0.32, 600, 9000, 2.2), 0.85)
    write("click.wav", sfx_click(), 0.8)
    for v in range(5):
        write(f"key-{v + 1}.wav", sfx_key(v), 0.75)
    write("tick.wav", sfx_tick(), 0.6)
    write("scroll-tick.wav", sfx_scroll_tick(), 0.5)
    write("drop-in.wav", sfx_drop_in(), 0.8)
    for name, n in [("pop-a.wav", 69), ("pop-d.wav", 74), ("pop-f.wav", 77)]:
        write(name, sfx_pop(midi(n)), 0.8)
    write("impact.wav", sfx_impact(), 0.95)
    write("levelup.wav", sfx_levelup(), 0.9)
    write("chime.wav", sfx_chime(), 0.75)
    write("riser.wav", sfx_riser(1.6), 0.7)
    write("logo-hit.wav", sfx_logo_hit(), 0.95)
    print("Music:")
    write("music.wav", music(), 0.85)
