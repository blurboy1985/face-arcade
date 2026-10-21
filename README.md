# Face Arcade

Three browser games you control with your **face** through a webcam. Face tracking runs locally in the browser with Google MediaPipe Face Landmarker — no video ever leaves your machine.

| Game | Players | Face controls | Keyboard |
|---|---|---|---|
| **Face Pilot** — space shooter | 1 | Move head → steer ship · open mouth → fire | Arrows/WASD + Space |
| **Face Jump** — Mario-style platformer | 1 | Lean/turn head → run · open mouth → jump (keep open = higher) | ←→/AD + Space/↑ |
| **Face Pong** — head-to-head pong | 2 (or vs computer) | Head up/down → paddle · open mouth at impact → power shot | P1 W/S + D · P2 ↑/↓ + ← |

Pick a game on the start screen (`index.html`).

## Run

The webcam only works on `localhost` or HTTPS, so serve the folder rather than double-clicking a file:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in **Chrome or Edge** and allow camera access.

## Tips

- **Calibration:** sit centered and hold still for ~1 second when a game starts. Press `C` to recalibrate.
- **Face Pong with 2 players:** sit side by side so both faces fit in the camera preview. The person on the left of the screen controls the left paddle.
- Each game's menu has sliders for head sensitivity and how wide your mouth must open.
- Other keys: `P` pause · `M` mute · `Enter` restart after game over.

## Camera troubleshooting

- **"Could not start video source" / black preview:** PCs often have virtual cameras (OBS, AMD Privacy View, LSVCam) that the browser picks by default. The **Camera** menu's *Auto* option skips them, or pick your real webcam there.
- **"Camera image is black":** open the webcam's privacy shutter / lens cover, or turn on a light.
- Close other apps using the camera (Teams, Zoom, Camera app) if it still won't start.

## Project layout

```
index.html       start screen — choose a game
space.html       Face Pilot
jump.html        Face Jump
pong.html        Face Pong
js/face.js       webcam selection + MediaPipe face tracking (shared)
js/util.js       helpers, sound effects, keyboard input (shared)
css/common.css   shared styles
```

No build step and no dependencies to install. Needs an internet connection on first load (MediaPipe library + model from CDN). All characters and art are original; Face Jump is inspired by classic platformers but uses no third-party assets.
