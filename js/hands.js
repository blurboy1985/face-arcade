// Webcam + hand tracking for the hand-controlled games (Hand Ninja, Hand Hockey).
// Uses MediaPipe Tasks Vision HandLandmarker; everything runs locally in the browser.
// Camera selection is shared with the face games (same menu choice, same virtual-camera skipping).
import { clamp } from "./util.js";
import { MP_BASE, openCamera, withTimeout, bindCameraSelect } from "./face.js";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

async function loadHandLandmarker(numHands) {
  const { HandLandmarker, FilesetResolver } = await import(`${MP_BASE}/vision_bundle.mjs`);
  const fileset = await FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO", numHands,
    minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  try {
    return await HandLandmarker.createFromOptions(fileset, opts("GPU"));
  } catch (err) {
    console.warn("GPU delegate failed, falling back to CPU", err);
    return HandLandmarker.createFromOptions(fileset, opts("CPU"));
  }
}

// Landmark indices: 0 wrist, 8 index fingertip; palm centre = wrist + the four finger knuckles.
const PALM = [0, 5, 9, 13, 17];
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

// Usage: const t = new HandTracker(videoEl, { numHands, cameraSelect, onStatus });
//        await t.start();  then each animation frame: const hands = t.update(now, dt);
// Each hand: { pts, tip: {x, y}, palm: {x, y}, size } in raw (un-mirrored) video coordinates, 0..1.
export class HandTracker {
  constructor(video, { numHands = 2, cameraSelect = null, onStatus = () => {} } = {}) {
    Object.assign(this, { video, numHands, cameraSelect, onStatus });
    this.landmarker = null;
    this.stream = null;
    this.hands = [];
    this.lostFor = 0;      // seconds with no hand detected
    this.dark = false;     // camera image is (nearly) black
    this.lastVideoTime = -1;
    this.darkCheckAt = 0;
    this.darkCanvas = document.createElement("canvas");
    this.darkCanvas.width = 32; this.darkCanvas.height = 24;
    this.darkCtx = this.darkCanvas.getContext("2d", { willReadFrequently: true });
  }

  get active() { return !!this.landmarker && !!this.stream; }
  get cameraLabel() { return this.stream?.getVideoTracks()[0]?.label || ""; }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not support webcam access.");
    this.stop();
    this.onStatus("Requesting camera…");
    this.stream = await openCamera(this.cameraSelect?.value || "auto", this.onStatus);
    this.video.srcObject = this.stream;
    try {
      await withTimeout(this.video.play(), 8000, "The camera started but isn't sending any video. Try another camera in the menu.");
    } catch (err) {
      this.stop();
      throw err;
    }
    if (this.cameraSelect) await bindCameraSelect(this.cameraSelect).catch(() => {}); // labels now available
    if (!this.landmarker) {
      try {
        this.onStatus("Loading hand model (first time takes a few seconds)…");
        this.landmarker = await loadHandLandmarker(this.numHands);
      } catch (err) {
        this.stop();
        throw err;
      }
    }
    this.onStatus("");
    this.lostFor = 0;
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.hands = [];
  }

  update(now, dt) {
    const v = this.video;
    if (!this.active || v.readyState < 2) return this.hands;
    if (v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      let res = {};
      try {
        res = this.landmarker.detectForVideo(v, now);
      } catch (err) {
        console.warn("Hand detection failed for this frame", err);
      }
      this.hands = (res.landmarks || []).map(makeHand);
    }
    this.lostFor = this.hands.length ? 0 : this.lostFor + dt;
    if (!this.hands.length && now > this.darkCheckAt) {
      this.darkCheckAt = now + 1000;
      this.dark = this.isDarkFrame();
    }
    return this.hands;
  }

  // True when the current camera frame is (nearly) black, e.g. a closed privacy shutter.
  isDarkFrame() {
    const { darkCanvas: c, darkCtx: g } = this;
    g.drawImage(this.video, 0, 0, c.width, c.height);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += (px[i] + px[i + 1] + px[i + 2]) / 3;
    return sum / (px.length / 4) < 15;
  }

  // Message to show while waiting for a hand, or "" if one is visible.
  lostMessage(who = "") {
    if (this.dark) return "Camera image is black — open the webcam's privacy shutter / lens cover";
    return `${who ? who + ": s" : "S"}how your hand to the camera`;
  }
}

// Builds a hand record from 21 landmarks (also used by the games' debug hooks to inject fake hands).
export function makeHand(pts) {
  const palm = { x: 0, y: 0 };
  for (const i of PALM) { palm.x += pts[i].x / PALM.length; palm.y += pts[i].y / PALM.length; }
  const size = Math.hypot(pts[9].x - pts[0].x, pts[9].y - pts[0].y); // wrist → middle knuckle
  return { pts, tip: { x: pts[8].x, y: pts[8].y }, palm, size };
}

// Splits hands between two players sitting side by side, by which half of the (mirrored) picture
// the palm is in. Raw video x is un-mirrored, so the person on the LEFT of the screen has the LARGER raw x.
export function splitBySide(hands) {
  return [hands.filter((h) => h.palm.x >= 0.5), hands.filter((h) => h.palm.x < 0.5)];
}

// Maps a raw camera point into a screen rectangle {x, y, w, h}. `cam` is the slice of the MIRRORED
// picture (0..1, left to right as the player sees it) that covers the rectangle; a margin is trimmed
// off so the rectangle's edges are easy to reach without leaving the camera's view.
export function mapToRect(p, rect, cam = { x0: 0, x1: 1 }, margin = 0.1) {
  const span = cam.x1 - cam.x0;
  const u = (1 - p.x - cam.x0 - span * margin) / (span * (1 - 2 * margin));
  const v = (p.y - margin) / (1 - 2 * margin);
  return { x: rect.x + clamp(u, 0, 1) * rect.w, y: rect.y + clamp(v, 0, 1) * rect.h };
}

// Draws hand skeletons on the camera-preview overlay canvas (raw coordinates; CSS mirrors it).
export function drawHands(ctx, hands, color = "rgba(94,224,255,0.8)") {
  const { width: w, height: h } = ctx.canvas;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  for (const hand of hands) {
    const p = hand.pts;
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) { ctx.moveTo(p[a].x * w, p[a].y * h); ctx.lineTo(p[b].x * w, p[b].y * h); }
    ctx.stroke();
    ctx.fillStyle = "#ffd25e";
    ctx.beginPath(); ctx.arc(hand.tip.x * w, hand.tip.y * h, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
  }
}
