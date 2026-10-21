// Webcam + face tracking shared by all Face Arcade games.
// Uses MediaPipe Tasks Vision FaceLandmarker; everything runs locally in the browser.
import { loadStr, saveStr } from "./util.js";

const MP_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const CAM_KEY = "faceArcadeCam";

// PCs often expose virtual cameras (OBS, AMD Privacy View, LSVCam, …) ahead of the real webcam.
// They either fail to start or send black frames, so "Auto" ranks them last and skips blank feeds.
const VIRTUAL_CAM = /virtual|obs|lsvcam|privacy view|snap camera|broadcast|manycam|xsplit|mmhmm|vcam|splitcam|\bndi\b/i;

async function loadLandmarker(numFaces) {
  const { FaceLandmarker, FilesetResolver } = await import(`${MP_BASE}/vision_bundle.mjs`);
  const fileset = await FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO", numFaces, outputFaceBlendshapes: true,
  });
  try {
    return await FaceLandmarker.createFromOptions(fileset, opts("GPU"));
  } catch (err) {
    console.warn("GPU delegate failed, falling back to CPU", err);
    return FaceLandmarker.createFromOptions(fileset, opts("CPU"));
  }
}

// Resolves to the promise's value, or rejects if it takes longer than `ms`.
function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

// ---------- Camera selection ----------
async function listCams() {
  const devs = await navigator.mediaDevices.enumerateDevices();
  return devs.filter((d) => d.kind === "videoinput" && d.deviceId);
}

// Fills a <select> with the available cameras and remembers the choice across games.
export async function bindCameraSelect(select) {
  if (!select.dataset.bound) {
    select.dataset.bound = "1";
    select.addEventListener("change", () => saveStr(CAM_KEY, select.value));
  }
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const cams = await listCams();
  const want = loadStr(CAM_KEY, "auto");
  select.replaceChildren(new Option("Auto (skip virtual cameras)", "auto"));
  cams.forEach((c, i) => {
    const label = c.label || `Camera ${i + 1}`;
    select.add(new Option(VIRTUAL_CAM.test(label) ? `${label} (virtual)` : label, c.deviceId));
  });
  select.value = [...select.options].some((o) => o.value === want) ? want : "auto";
}

// True if the stream only delivers black/flat frames (e.g. a virtual camera with no source).
async function isBlankStream(stream, timeoutMs = 1500) {
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.srcObject = stream;
  try { await withTimeout(v.play(), 3000, "no frames"); }
  catch (err) { v.srcObject = null; return err.message === "no frames"; } // a stream that never plays counts as blank
  const c = document.createElement("canvas");
  c.width = 32; c.height = 24;
  const g = c.getContext("2d", { willReadFrequently: true });
  const end = performance.now() + timeoutMs;
  try {
    while (performance.now() < end) {
      await new Promise((r) => setTimeout(r, 150));
      if (v.readyState < 2) continue;
      g.drawImage(v, 0, 0, c.width, c.height);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, sq = 0;
      for (let i = 0; i < px.length; i += 4) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += l; sq += l * l; }
      const n = px.length / 4, mean = sum / n, sd = Math.sqrt(Math.max(0, sq / n - mean * mean));
      if (mean > 12 || sd > 6) return false;
    }
    return true;
  } finally {
    v.srcObject = null;
  }
}

// Opens the chosen camera, or in "auto" mode the best working one: real cameras before virtual
// ones, skipping any that fail to start or only send black frames. Some webcams (notably 4K USB
// ones) also reject certain resolutions, so each device is tried at a few sizes.
async function openCamera(choice, onStatus) {
  let lastErr = null;
  const tryOpen = async (video) => {
    try { return await navigator.mediaDevices.getUserMedia({ video, audio: false }); }
    catch (err) {
      lastErr = err;
      if (err.name === "NotAllowedError" || err.name === "SecurityError") throw err; // retrying won't help
      console.warn("Camera attempt failed", video, err);
      await new Promise((r) => setTimeout(r, 250)); // give the driver a moment to release
      return null;
    }
  };
  const SIZES = [{ width: { ideal: 1280 }, height: { ideal: 720 } }, { width: { ideal: 640 }, height: { ideal: 480 } }, {}];
  const openDevice = async (cam) => {
    for (const size of SIZES) {
      onStatus(`Trying camera "${cam.label || "camera"}"…`);
      const s = await tryOpen({ deviceId: { exact: cam.deviceId }, ...size });
      if (s) return s;
    }
    return null;
  };

  let cams = await listCams();
  // Without permission yet, devices have no labels; open the default once to get permission.
  if (!cams.some((c) => c.label)) {
    const s = await tryOpen(true);
    if (s) {
      const label = s.getVideoTracks()[0]?.label || "";
      if (choice === "auto" && !VIRTUAL_CAM.test(label) && !(await isBlankStream(s))) return s;
      s.getTracks().forEach((t) => t.stop());
    }
    cams = await listCams();
  }

  // A specific camera picked in the menu: use it as-is (even if virtual), fall back to auto if it fails.
  const picked = cams.find((c) => c.deviceId === choice);
  if (picked) {
    const s = await openDevice(picked);
    if (s) return s;
  }

  const ranked = [...cams.filter((c) => !VIRTUAL_CAM.test(c.label)), ...cams.filter((c) => VIRTUAL_CAM.test(c.label))];
  let blankFallback = null;
  for (const cam of ranked) {
    if (cam === picked) continue;
    const s = await openDevice(cam);
    if (!s) continue;
    if (!(await isBlankStream(s))) { blankFallback?.getTracks().forEach((t) => t.stop()); return s; }
    console.warn(`Camera "${cam.label}" only sends black frames, trying the next one`);
    if (!blankFallback) blankFallback = s; else s.getTracks().forEach((t) => t.stop());
  }
  if (blankFallback) return blankFallback; // better a dark camera than none (lens cover / dark room)
  throw lastErr || new DOMException("No working camera found", "NotFoundError");
}

// ---------- Tracker ----------
// Usage: const t = new FaceTracker(videoEl, { numFaces, cameraSelect, onStatus });
//        await t.start();  then each animation frame: const faces = t.update(now, dt);
// Each face: { nose: {x, y}, jaw, pts } in raw (un-mirrored) video coordinates, 0..1.
export class FaceTracker {
  constructor(video, { numFaces = 1, cameraSelect = null, onStatus = () => {} } = {}) {
    Object.assign(this, { video, numFaces, cameraSelect, onStatus });
    this.landmarker = null;
    this.stream = null;
    this.faces = [];
    this.lostFor = 0;      // seconds with no face detected
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
        this.onStatus("Loading face model (first time takes a few seconds)…");
        this.landmarker = await loadLandmarker(this.numFaces);
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
    this.faces = [];
  }

  update(now, dt) {
    const v = this.video;
    if (!this.active || v.readyState < 2) return this.faces;
    if (v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      let res = {};
      try {
        res = this.landmarker.detectForVideo(v, now);
      } catch (err) {
        console.warn("Face detection failed for this frame", err);
      }
      this.faces = (res.faceLandmarks || []).map((pts, i) => {
        const jaw = res.faceBlendshapes?.[i]?.categories.find((c) => c.categoryName === "jawOpen");
        return { pts, nose: { x: pts[1].x, y: pts[1].y }, jaw: jaw ? jaw.score : 0 }; // landmark 1 = nose tip
      });
    }
    this.lostFor = this.faces.length ? 0 : this.lostFor + dt;
    if (!this.faces.length && now > this.darkCheckAt) {
      this.darkCheckAt = now + 1000;
      this.dark = this.isDarkFrame();
    }
    return this.faces;
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

  // Message to show while waiting for a face, or "" if one is visible.
  lostMessage(who = "") {
    if (this.dark) return "Camera image is black — open the webcam's privacy shutter / lens cover";
    return `${who ? who + ": f" : "F"}ace not found — look at the camera`;
  }
}

// Averages the nose position over the first few frames to find a player's neutral pose.
export class Calibrator {
  constructor(frames = 15) { this.frames = frames; this.reset(); }
  reset() { this.samples = []; this.value = null; }
  feed(p) {
    if (this.value) return true;
    this.samples.push({ x: p.x, y: p.y });
    if (this.samples.length >= this.frames) {
      const n = this.samples.length;
      this.value = {
        x: this.samples.reduce((s, q) => s + q.x, 0) / n,
        y: this.samples.reduce((s, q) => s + q.y, 0) / n,
      };
      this.samples = [];
    }
    return !!this.value;
  }
}

// Draws face landmarks on the camera-preview overlay canvas (raw coordinates; CSS mirrors it).
export function drawFaces(ctx, faces, colors = ["rgba(94,224,255,0.55)"]) {
  const { width: w, height: h } = ctx.canvas;
  faces.forEach((f, i) => {
    const col = colors[i % colors.length];
    ctx.fillStyle = col;
    for (const p of f.pts) ctx.fillRect(p.x * w - 1, p.y * h - 1, 2, 2);
    ctx.fillStyle = "#ff5ea8";
    ctx.beginPath(); ctx.arc(f.nose.x * w, f.nose.y * h, 6, 0, Math.PI * 2); ctx.fill();
  });
}

// Keeps a camera-preview overlay canvas the same size as the video frames.
export function syncOverlay(overlay, video) {
  const w = video.videoWidth || 640, h = video.videoHeight || 480;
  if (overlay.width !== w || overlay.height !== h) { overlay.width = w; overlay.height = h; }
}
