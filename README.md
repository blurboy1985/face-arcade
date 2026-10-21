# Face Arcade

**▶ Play now: https://face-arcade.danielquek.com** (Chrome or Edge, allow camera access) — mirror: https://blurboy1985.github.io/face-arcade/

Three browser games you control with your **face** through a webcam. Face tracking runs locally in the browser with Google MediaPipe Face Landmarker — no video ever leaves your machine.

| Game | Players | Head | Open mouth | Pucker lips | Keyboard |
|---|---|---|---|---|---|
| **Face Pilot** — space shooter | 1 | steer ship | fire | shield bubble (2.5 s, 8 s cooldown) | Arrows/WASD · Space · X |
| **Face Jump** — Mario-style platformer | 1 | lean/turn to run | jump (keep open = higher) | blow a bubble that traps a slime — touch it to pop | ←→/AD · Space/↑ · X |
| **Face Pong** — head-to-head pong | 2 (or vs computer) | up/down moves paddle | at impact → power shot | at impact → curve shot (once per rally) | P1 W/S · D · A — P2 ↑/↓ · ← · → |

Pick a game on the start screen (`index.html`).

## Run locally

The webcam only works on `localhost` or HTTPS, so serve the folder rather than double-clicking a file:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in **Chrome or Edge** and allow camera access.

## Tips

- **Calibration:** sit centered with a relaxed face and hold still for ~1 second when a game starts — this also records your resting lip shape so only a clear pucker counts. Press `C` to recalibrate.
- **Face Pong with 2 players:** sit side by side so both faces fit in the camera preview. The person on the left of the screen controls the left paddle.
- Each game's menu has sliders for head sensitivity and how wide your mouth must open.
- Other keys: `P` pause · `M` mute all sound · `N` music on/off · `Q` quit to menu · `Enter` restart after game over.
- **Music:** each game has its own original chiptune soundtrack, generated live with the Web Audio API (no audio files). Toggle it with the *Music* checkbox in the menu or `N`.

## Camera troubleshooting

- **"Could not start video source" / black preview:** PCs often have virtual cameras (OBS, AMD Privacy View, LSVCam) that the browser picks by default. The **Camera** menu's *Auto* option skips them, or pick your real webcam there.
- **"Camera image is black":** open the webcam's privacy shutter / lens cover, or turn on a light.
- Close other apps using the camera (Teams, Zoom, Camera app) if it still won't start.

## Deploy

- **Cloudflare** (face-arcade.danielquek.com): a static-assets Worker configured in `wrangler.jsonc`.
  `.assetsignore` uploads only the site files. Deploy with:

  ```bash
  npx wrangler@4.148.0 deploy
  ```

- **GitHub Pages** mirror: updates automatically on every push to `main`.

## Project layout

```
index.html       start screen — choose a game
space.html       Face Pilot
jump.html        Face Jump
pong.html        Face Pong
js/face.js       webcam selection + MediaPipe face tracking (shared)
js/util.js       helpers, sound effects, keyboard input (shared)
js/music.js      chiptune sequencer + the three background songs
css/common.css   shared styles
```

No build step and no dependencies to install. Needs an internet connection on first load (MediaPipe library + model from CDN). All characters and art are original; Face Jump is inspired by classic platformers but uses no third-party assets.
