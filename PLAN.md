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

## Third action: lip pucker (2026-10-21)
- `face.js`: per-face `mouthPucker` score; Calibrator records resting pucker (capped 0.3);
  `puckerLevel()` = pucker above resting level, 0 while mouth is open.
- Pilot: pucker/X → shield bubble 2.5 s (asteroids bounce off), 8 s cooldown, HUD status.
- Jump: pucker/X → bubble (one at a time) traps a slime 4 s; touch to pop (+200); escapes after.
- Pong: pucker at impact (A / → on keyboard) → curve shot, once per player per rally; paddle glows purple.
- Pucker meter + "Pucker trigger level" slider; launcher + README updated.
- [x] Verified in Chrome via step(): all behaviours above, level still beatable by bot, no console errors.
- [x] Published at https://face-arcade.danielquek.com — Cloudflare Worker "face-arcade" (static assets,
  custom domain) on account daniel.tianwen@gmail.com, via `npx wrangler@4.148.0 deploy`.
  Uploaded exactly the 8 site files (allowlist `.assetsignore`); PLAN/README/config/.git return 404.

## Fix: Face Jump can't reach the platforms (2026-10-21)
- Cause: brick/? rows are 4.0 tiles above ground; max jump was 3.93 (jumpV 16, hold gravity 32).
- Fix: jumpV 17.5, hold gravity 30 → full jump ~5 tiles, tap ~2.5.
- Verify: land on every platform row (y=9 from ground, upper y=6 row from the y=9 row),
  bot still clears the level, then redeploy Cloudflare + push.
- [x] Held jump 5.03 tiles (face: mouth held open, same), tap 2.62. Landed on all 5 platform rows from the
  ground and on the upper bridge floor; bot clears the level; screenshot shows Pip on the bricks.

## Previous work (Face Pilot)
- Done and verified; camera fix: Chrome lists LSVCam / AMD Privacy View / OBS Virtual (virtual) + UGREEN Camera 4K (real).
  Auto mode ranks real cams first and skips black feeds. User's UGREEN image was black (shutter likely closed).

## Two 2-player HAND games (2026-10-24)
Request: 2 more games, 2 players, controlled by hand movement; one is a Fruit Ninja-style game.
Ship it: branch `hand-games` → PR → self-review → merge → Cloudflare deploy (user pre-authorized, no check-ins).

| Page | Game | Players | Hand controls | Fallback |
|---|---|---|---|---|
| `ninja.html` | **Hand Ninja** — fruit slicing duel | 2 (or 1) | index fingertip = blade; swipe fast to slice | mouse / touch |
| `hockey.html` | **Hand Hockey** — air hockey | 2 (or vs CPU) | palm moves your mallet in your half | P1 WASD · P2 arrows |

Design
- `js/hands.js`: `HandTracker` (MediaPipe HandLandmarker, up to 4 hands), reuses `openCamera` from `face.js`
  (exported, behaviour unchanged). Hands split between players by side of the mirrored picture, like Pong faces.
- Ninja 2P: screen split into two lanes; both lanes get the **same seeded fruit waves** (fair duel). 60 s round,
  fruit +1, combo (3+ in one swipe) bonus, gold fruit +5, bomb −10 and blade stunned 1 s. Highest score wins.
- Hockey: puck/mallet circle physics in sub-steps, mallet velocity transfers to puck, goals left/right, first to 7.
- Two new original chiptunes in `music.js`; new SFX in `util.js`.
- Launcher cards, README, `.assetsignore` updated.

Verify
- Both pages load with no console errors; launcher shows 5 cards.
- Injected fake hand data via `window.handNinja` / `window.handHockey` debug hooks: hand→player assignment,
  swipe slices fruit (slow move doesn't), bomb penalty, combos, round end + winner; mallet hits puck, goals,
  win screen, CPU plays, keyboard mode.
- Live site serves ninja.html / hockey.html after deploy.

Status (2026-10-24)
- [x] Built `js/hands.js`, `ninja.html`, `hockey.html`, 2 songs, SFX, launcher cards, README, `.assetsignore`.
- [x] Verified in the browser pane with injected hands (`window.handNinja` / `window.handHockey`):
  - Ninja: waiting messages per player; both lanes get identical fruit; slow sweep (240 px/s) doesn't slice,
    fast swipe does; bomb −10 + 1 s jam; 3-fruit swipe → +3 combo; round end → winner screen; mouse mode slices.
  - Hockey: waiting messages; hands → correct half; swing shot (1650 px/s); goal + serve to conceder; 7-goal win
    screen; keyboard mallets move; 3-minute CPU soak per skill — puck never stalls, Easy 8–10 / Normal 13–7 /
    Hard 21–3 vs a scripted player.
  - All 5 pages load with no errors; all 5 songs 128 steps; real HandLandmarker model loads from the CDN.
- Fixes found while testing: first swipe after holding still was measured over the whole pause (never sliced);
  blade-continuity limit too tight for fast swipes; CPU only nudged the puck (stalled kick-off) and could push a
  puck behind it into its own goal.
- [ ] Real webcam play with two people — needs the user (no camera in the test browser).
