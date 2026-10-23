# Face Arcade

**▶ Play now: https://face-arcade.danielquek.com** (Chrome or Edge, allow camera access) — mirror: https://blurboy1985.github.io/face-arcade/

Five browser games you control with your **face** or **hands** through a webcam. Tracking runs locally in the browser with Google MediaPipe (Face Landmarker / Hand Landmarker) — no video ever leaves your machine.

| Game | Players | Head | Open mouth | Pucker lips | Keyboard |
|---|---|---|---|---|---|
| **Face Pilot** — space shooter, 5 sectors + bosses | 1 | steer ship | fire | shield bubble (2.5 s, 8 s cooldown; blocks shots) | Arrows/WASD · Space · X |
| **Face Jump** — Mario-style platformer, 4 worlds + bosses | 1 | lean/turn to run | jump (keep open = higher) | blow a bubble that traps an enemy (touch to pop) or stuns a boss | ←→/AD · Space/↑ · X |
| **Face Pong** — head-to-head pong | 2 (or 5-boss tournament) | up/down moves paddle | at impact → power shot | at impact → curve shot (once per rally) | P1 W/S · D · A — P2 ↑/↓ · ← · → |

Hand games:

| Game | Players | Hands | Fallback |
|---|---|---|---|
| **Hand Ninja** — Fruit Ninja-style slicing duel | 2 (or 1) | index fingertip is your blade — swipe fast through fruit (it slices everything it sweeps through); 5 stages of rising speed, each ending in a boss to slash before it escapes; power orbs: ❄ freeze, ⚡ mega blade, ×2 points, 🍉 fruit frenzy; streak multiplier up to ×4; avoid bombs (−10, blade jams 1 s) | mouse / touch (solo) |
| **Hand Hockey** — air hockey | 2 (or 5-boss tournament) | your palm moves your mallet in your half; swing into the puck for a hard shot | P1 WASD — P2 arrows |

Pick a game on the start screen (`index.html`).

Every game has levels and bosses:

- **Face Pilot:** 5 sectors (more asteroids, then fighters and mines) each ending in a boss — Rock Titan, Saucer Queen, Pirate Cruiser, Hive Mother, Void Dreadnought. Capsules: spread shot, rapid fire, mega laser, extra life, smart bomb.
- **Face Jump:** 4 worlds (Grassland, Desert, Caves, Castle) with spiky slimes and bats; stomp the boss at the end of each world (King Slime, Spike Shell, Bat Baron, Lava Golem) to open the gate to the flag. ? blocks hide a star (invincible), feather (double jump) or extra life.
- **Hand Ninja:** 5 stages with a boss each, power orbs, streak multiplier.
- **Face Pong / Hand Hockey:** solo tournament against 5 computer bosses with their own tricks; power orbs in every mode (big paddle/mallet, multi-ball/puck, freeze opponent, goal guard).

Menus have a "start at stage/sector/world" setting for practice.

## Run locally

The webcam only works on `localhost` or HTTPS, so serve the folder rather than double-clicking a file:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in **Chrome or Edge** and allow camera access.

## Tips

- **Calibration:** sit centered with a relaxed face and hold still for ~1 second when a game starts — this also records your resting lip shape so only a clear pucker counts. Press `C` to recalibrate.
- **Face Pong with 2 players:** sit side by side so both faces fit in the camera preview. The person on the left of the screen controls the left paddle.
- **Hand games with 2 players:** sit side by side; hands on the left half of the preview belong to the left player. In Hand Ninja both players get exactly the same fruit, so it's a fair race.
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
ninja.html       Hand Ninja
hockey.html      Hand Hockey
js/face.js       webcam selection + MediaPipe face tracking (shared)
js/hands.js      MediaPipe hand tracking for the hand games (reuses face.js camera code)
js/util.js       helpers, sound effects, keyboard input (shared)
js/music.js      chiptune sequencer + the five background songs
css/common.css   shared styles
```

No build step and no dependencies to install. Needs an internet connection on first load (MediaPipe library + model from CDN). All characters and art are original; Face Jump and Hand Ninja are inspired by classic games but use no third-party assets.
