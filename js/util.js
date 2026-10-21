// Small helpers shared by all Face Arcade games.

export const $ = (id) => document.getElementById(id);
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;

// ---------- Storage (may be unavailable in private windows) ----------
export function loadStr(key, def = "") { try { return localStorage.getItem(key) ?? def; } catch { return def; } }
export function saveStr(key, v) { try { localStorage.setItem(key, String(v)); } catch { /* storage unavailable */ } }
export function loadNum(key, def = 0) { const s = loadStr(key, ""); const v = Number(s); return s === "" || Number.isNaN(v) ? def : v; }

// ---------- Canvas ----------
// Sizes a full-window canvas for the device pixel ratio. Returns a live { W, H, ctx } view.
export function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext("2d");
  const view = { W: 0, H: 0, ctx };
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.W = window.innerWidth; view.H = window.innerHeight;
    canvas.width = view.W * dpr; canvas.height = view.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize?.(view);
  };
  window.addEventListener("resize", resize);
  resize();
  return view;
}

// Centered banner text over the game (pause, "face not found", etc.).
export function drawBanner(ctx, W, H, text, color = "#ffd25e") {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, H / 2 - 36, W, 72);
  ctx.fillStyle = color;
  ctx.font = `600 ${W < 600 ? 17 : 24}px system-ui, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2);
  ctx.restore();
}

// ---------- Audio ----------
let actx = null;
export const audio = { muted: false };

const SFX = {
  laser:  ["square", 900, 250, 0.09, 0.04],
  boom:   ["sawtooth", 140, 40, 0.3, 0.08],
  star:   ["sine", 660, 1320, 0.15, 0.08],
  hit:    ["triangle", 220, 50, 0.5, 0.15],
  jump:   ["square", 300, 700, 0.14, 0.05],
  coin:   ["square", 990, 1480, 0.12, 0.05],
  stomp:  ["triangle", 400, 90, 0.15, 0.12],
  bump:   ["triangle", 160, 110, 0.08, 0.1],
  paddle: ["square", 440, 440, 0.06, 0.05],
  power:  ["sawtooth", 300, 1200, 0.2, 0.07],
  wall:   ["square", 260, 260, 0.04, 0.03],
  score:  ["sine", 520, 260, 0.35, 0.1],
  win:    ["sine", 523, 1046, 0.6, 0.1],
  shield: ["sine", 220, 880, 0.35, 0.09],
  bounce: ["triangle", 500, 300, 0.08, 0.08],
  bubble: ["sine", 300, 900, 0.18, 0.08],
  pop:    ["square", 1200, 600, 0.07, 0.05],
  curve:  ["sine", 900, 300, 0.3, 0.08],
};

// One shared AudioContext for sound effects and music (null if Web Audio is unavailable).
export function getAudioContext() {
  try { actx ||= new AudioContext(); } catch { return null; }
  return actx;
}

export function sfx(kind) {
  if (audio.muted) return;
  try {
    actx ||= new AudioContext();
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    const [type, f0, f1, dur, vol] = SFX[kind];
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur);
  } catch { /* audio unavailable */ }
}

// Browsers only allow audio to start from a user gesture, so call this from button clicks.
export function unlockAudio() {
  try { actx ||= new AudioContext(); if (actx.state === "suspended") actx.resume(); } catch { /* audio unavailable */ }
}

// ---------- Keyboard ----------
// Tracks held keys; clears them when the window loses focus so nothing gets "stuck".
export function trackKeys(onDown) {
  const keys = new Set();
  window.addEventListener("keydown", (e) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    const fresh = !keys.has(e.code);
    keys.add(e.code);
    if (fresh) onDown?.(e.code);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());
  return keys;
}

// Friendly message for camera / face-tracking start-up errors.
export function cameraErrorMessage(err) {
  if (err?.name === "NotAllowedError") return "Camera permission was denied. Allow it in the address bar and try again.";
  if (err?.name === "NotFoundError") return "No webcam found. You can still play with the keyboard.";
  if (err?.name === "NotReadableError" || err?.name === "AbortError") {
    return "The camera couldn't start. It's probably in use by another app (Teams, Zoom, Camera app, OBS, another browser tab). Close those, or unplug and replug the webcam, then try again.";
  }
  return `Couldn't start face tracking: ${err?.message || err}`;
}
