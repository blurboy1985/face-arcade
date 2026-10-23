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
- [x] PR https://github.com/blurboy1985/face-arcade/pull/1 merged; deployed to https://face-arcade.danielquek.com
  (wrangler version bb595b4b; 11 site files) — /ninja and /hockey load live with no console errors.

## Hand Ninja: stages, bosses, powers (2026-10-24)
Request: multiple stages with rising difficulty, special powers, bosses; bigger fruit; bigger slicing area;
slice many fruits at once. Ship via PR → self-review → merge → deploy (user pre-authorized).

- **5 stages** (Orchard → Market → Jungle → Volcano → Dragon's Peak): each = intro → fruit phase (30 s, setting)
  → boss → stage clear. Per stage: faster fruit (gravity × speed²), shorter wave gaps, more fruit per wave,
  more bombs; difficulty also ramps within a stage. Own background colours per stage.
- **Bosses** (one per stage, HP rises 8 → 26, 30 s to beat or it escapes): King Melon (drifts), Pineapple Brute
  (bounces), Coconut Golem (periodic shield blocks hits), Durian Dragon (throws bombs), Dragonfruit Overlord
  (teleports, bombs, fruit minions). Each blade hits a boss at most every 0.22 s. Defeat bonus = 20 × stage +
  seconds left. Duel: each lane gets its own boss copy driven by an identically-seeded RNG → fair.
- **Powers** (glowing orbs in the fruit waves, same in both lanes; slice to activate for yourself):
  ❄ Freeze (your lane slow-mo 5 s) · ⚡ Mega blade (2.5× hit area, low speed needed, 2× boss damage, 6 s)
  · ×2 Double points (8 s) · 🍉 Fruit frenzy (burst of bonus fruit).
- **Streak multiplier**: every 8 fruit in a row adds ×1 (max ×4); a missed fruit or bomb resets it.
- **Bigger**: fruit radius ~0.085 × min(lane, height) (was 0.055); blade has a hit radius (~3.5% of screen)
  added to every fruit, so one swipe through a cluster slices all of it; thicker trail.
- Settings: stage length, start stage (1–5, for practice).

Verify (debug hook `handNinja.goto(stage, phase)` + injected hands): stage progression & end screen,
difficulty numbers rise per stage, each boss's behaviour (shield blocks, bombs thrown, teleport, minions),
boss HP/defeat bonus/escape, every power, multi-fruit swipe, streak reset on miss, both lanes identical.
- [x] Verified (injected hands / pointer events, 1280×720 and narrow portrait):
  full 5-stage run → end screen; per-stage fruit 24→65, launch speed 1806→2386 px/s, more bombs; both lanes
  identical incl. boss moves; sizes at 1280×720 2P: fruit r 61 (was ~38), boss r 109, blade reach 25 (mega 63);
  one swipe sliced a 5-fruit cluster (+5 combo), fruit just outside reach untouched; streak hits 8, miss → 0;
  double = +2/fruit, mega slices a slow sweep at 2× reach, freeze slows own lane only, frenzy fills own lane only;
  King Melon down in 8 hits (+57 incl. time bonus), unbeaten boss escapes at 30 s → next stage; ≤5 boss hits/s;
  Coconut shield blocks then un-blocks; Durian throws bombs; Dragonfruit teleports; mouse run from stage 4 beats
  both bosses; no console errors.
- [x] PR https://github.com/blurboy1985/face-arcade/pull/2 merged; deployed (wrangler version ff7089bc) —
  live /ninja runs to the stage-5 boss with no console errors.
- [ ] Real webcam play — needs the user.

## Stages, bosses & powers for the other four games (2026-10-24)
Request: "do the same if applicable" (Hand Ninja got stages + rising difficulty, bosses, powers, bigger items).
One branch `stages-all-games`, one commit per game → PR → self-review → merge → deploy (pre-authorized).

**Face Pilot** — 5 sectors (Asteroid Belt → Nebula → Pirate Lanes → Hive → Void), ~40 s of waves then a boss.
- Ramp per sector: asteroid rate/speed; new enemies from sector 2: fighters that shoot aimed bolts; sector 4+: mines.
- Bosses (HP bar, bullet patterns; laser hits; shield blocks bullets): Rock Titan (rock volleys), Saucer Queen
  (aimed bursts), Pirate Cruiser (spread fans), Hive Mother (spawns fighters + spread), Void Dreadnought (all + rings).
- Power capsules (bigger, magnet pickup): spread shot, rapid fire, mega laser (fat, 2 dmg), extra life, smart bomb.
- Fatter laser hitbox. Win after sector 5; setting: start sector.

**Face Jump** — 4 worlds (Grassland = current level, Desert, Caves, Castle), each ending in a boss arena with a gate
that opens when the boss falls; score/lives carry over.
- Worlds 2–4 generated from fixed seeds (same layout every play) out of safe chunks: pit width ≤ 4 (jump reach ~8),
  pipe/stair height ≤ 4–5 (jump ~5). Difficulty: more/faster slimes, wider pits; new enemies: spiky slimes (can't be
  stomped — bubble them) from world 2, bats (sine flight, stompable) from world 3.
- Bosses (stomp the head; a bubble stuns for 2 s): King Slime (hops), Spike Shell (charges, spiky unless stunned/dizzy),
  Bat Baron (swoops), Lava Golem (hops + fireballs).
- Power-ups from some ? blocks: ★ star (invincible 8 s), 🪶 feather (double jump 15 s), ♥ extra life.
- Setting: start world.

**Face Pong** — 1P mode becomes a 5-opponent tournament (bosses with gimmicks, first to 5 each): Rookie, Twin Paddles,
Wall Builder (barrier blocks mid-court), Speed Demon, Omega (big paddle, splits the ball). Power orbs mid-court for
everyone (ball → orb gives it to the last hitter): big paddle, multi-ball, freeze opponent, goal guard. Bigger ball.

**Hand Hockey** — same idea: 5-opponent tournament (Rookie, Goalie Giant, Twin Mallets, Speedster, Iron Golem) + table
power orbs (big mallet, multi-puck, freeze opponent, goal guard). Slightly bigger puck/mallets.

Verify each with its debug hook: stage/opponent progression and end screens, each boss behaviour, each power,
difficulty numbers rising, no console errors; Face Jump: a scripted bot can finish every world (reachability).
- [x] Verified via debug hooks (keyboard/injected input), 1280×720 + narrow pane, no console errors on any page:
  - Pilot: full run sector 1→5 → "Galaxy saved!"; fighters from s2, mines from s4; boss shots 2→125 per fight;
    spread=4 lasers, rapid cd 0.08, mega, life, smart bomb clears; shield blocks shots; mine → 8 shots;
    capsule magnet; laser hits 6 px past an edge, misses at 9 px.
  - Jump: bot clears all 4 worlds' terrain with 0 deaths (31–37 s each); King Slime 3 stomps → gate opens →
    flag → next world (score/lives kept); Spike Shell: spiky stomp kills, bubble stun + dizzy allow stomps;
    Bat Baron dives & stompable; Lava Golem fireballs; star hurts boss; ? block → feather → double jump;
    world 4 → "All worlds clear!". (Bot initially failed W1 by over-jumping a stair — bot fix, level unchanged.)
  - Pong: perfect-P1 bot wins tournament (45/78/56/32/26 s per boss) → champion; loss → retry same boss;
    big paddle 170→272, freeze, multi-ball 3, guard saves, orb → last hitter, walls bounce, Omega shrinks 289→207.
    Fixed: CPU aim error never missed (Rookie took 530 s) → errors >1 so bosses can be beaten.
  - Hockey: all bosses play to the end, puck never stalls (was: Goalie Giant left slow pucks dead → fixed);
    bot results per boss (3 games): Rookie 3/3, Goalie Giant 1/3, Speedster 2/3, Twin Mallets 0/3,
    Iron Golem 0/3 → reordered + softened; powers, guard, orb, retry/champion flows OK.
