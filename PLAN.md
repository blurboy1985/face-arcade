# Face Arcade — Plan

## Goal
Webcam face-controlled browser games. A launcher lets the player choose 1 of 3 games.

## Games
| Page | Game | Players | Face controls |
|---|---|---|---|
| `space.html` | **Face Pilot** — space shooter (done, moved from index.html) | 1 | head moves ship, mouth = fire |
| `jump.html` | **Face Jump** — Mario-style side-scrolling platformer (original art/characters, no Nintendo assets) | 1 | head left/right = run, mouth = jump |
| `pong.html` | **Face Pong** — 2 faces, 1 webcam | 2 (or vs CPU) | head up/down = paddle, mouth at impact = power shot |

`index.html` = launcher with 3 game cards.

## Shared code
- `js/face.js` — camera open/selection (skip virtual/black cams), MediaPipe FaceLandmarker (numFaces 1 or 2),
  per-frame detection, dark-frame detection, calibrator, overlay drawing.
- `js/util.js` — DOM/math helpers, storage, sound effects, canvas sizing.
- `css/common.css` — shared look (menu cards, HUD, camera panel).

## Steps
1. Shared modules (`js/face.js`, `js/util.js`, `css/common.css`).
2. Port Face Pilot to `space.html` using shared modules (behaviour unchanged).
3. Face Jump (`jump.html`): tile level, physics, enemies (stomp), ? blocks, coins, pits, checkpoints, flag, lives.
4. Face Pong (`pong.html`): 2-face assignment by screen side, per-player calibration, power shot, first to 7, keyboard 2P, vs CPU.
5. Launcher `index.html`; README update.

## Verification
- Each page loads with no console errors (built-in browser pane).
- Keyboard modes played via scripted input: movement, scoring, lose/win flows.
- Face logic checked with injected face data (incl. 2-face side assignment for Pong).
- Real webcam run in user's Chrome (Face Pilot/Jump: single face; Pong: needs 2 people — user to confirm).
- Independent bug-review agent pass, fixes re-verified.

## Status (2026-10-21) — DONE
- [x] Steps 1–5 built. Verified in Chrome via a `step(dt)` debug hook (pane/Chrome throttle rAF when hidden):
  - Launcher renders, no console errors on any page.
  - Face Pilot port: move/fire/lives/game over; face steering + calibration messages unchanged.
  - Face Jump: held jump 3.93 tiles, tap 2.2; ? block → coin; side contact hurts; scripted bot beats the level; win screen; face run/jump/dead zone; Q quits.
  - Face Pong: paddles, rallies, power shot, scoring, serve to loser, 7-0 win screen, rematch reset,
    2-face side assignment, solo picks largest face, per-player waiting messages.
  - Real webcam start (UGREEN) in Chrome for Pong (numFaces 2) and Jump: camera + model load.
- [x] Review agent findings fixed: stair-valley soft-lock (now a solid pyramid), stomps at low FPS (checked per
  sub-step; 200/200 stomps at 20 fps), double-stomp, solo face pick, preview cropping (object-fit contain),
  play() timeouts; plus Q = quit to menu in all games.
- [ ] Real 2-person Pong + playing with an uncovered camera — needs the user.
- [x] Pushed to new public repo https://github.com/blurboy1985/face-arcade (branch main).
- [x] GitHub Pages enabled (main, /): https://blurboy1985.github.io/face-arcade/

## Background music (2026-10-21)
- `js/music.js`: tiny Web Audio chiptune sequencer (lead / arpeggio / bass / drums) + 3 original songs
  (Pilot: A minor synth arps · Jump: bouncy C major · Pong: driving E minor). No audio files, no copied tunes.
- Plays while a game is running; pauses on pause / hidden tab; stops on game over, win, menu.
- Toggle: "Music" checkbox in each menu + `N` key (remembered). `M` still mutes everything.
- Verify: song bars well-formed, music bus produces signal while playing and silence when paused/stopped,
  no console errors; push → Pages redeploy.
- [x] Verified in Chrome (real click to unlock audio, AnalyserNode on the music bus): all 3 songs 128 steps;
  RMS ~0.06–0.07 while playing, 0 when paused / after win / game over / muted (M) / on menu;
  N toggles + persists; rematch restarts at step 0; no console errors.

## Previous work (Face Pilot)
- Done and verified; camera fix: Chrome lists LSVCam / AMD Privacy View / OBS Virtual (virtual) + UGREEN Camera 4K (real).
  Auto mode ranks real cams first and skips black feeds. User's UGREEN image was black (shutter likely closed).
