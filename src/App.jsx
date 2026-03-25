import { useEffect, useMemo, useRef, useState } from "react";
import Controls from "./components/Controls.jsx";
import Grid from "./components/Grid.jsx";
import LevelSelect from "./components/LevelSelect.jsx";
import GameOver from "./components/GameOver.jsx";
import WinScreen from "./components/WinScreen.jsx";

const PLAYER_DELAY_MS = 70;
const LOADING_MS = 2200;
const LOADING_BLOCKS = 18;
const TRAIL_DECAY_MS = 90;

const SNAKE_START_DELAY_MS = 1400;
const COMBO_WINDOW_MS = 2200;

const PLAYER_SKINS = [
  { id: "blue", name: "Blue", hex: "#3b82f6" },
  { id: "red", name: "Red", hex: "#ef4444" },
  { id: "purple", name: "Purple", hex: "#a855f7" },
  { id: "cyan", name: "Cyan", hex: "#22d3ee" }
];

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function makeLevels() {
  // 60 levels, smoothly scaling difficulty.
  return Array.from({ length: 60 }, (_, i) => {
    const id = i + 1;
    const t = (id - 1) / 59; // 0..1

    const gridSize = Math.min(26, 16 + Math.floor((id - 1) / 8)); // grows slowly
    const snakeSpeed = Math.max(140, Math.round(340 - id * 3.2)); // faster over time
    const snakeLength = Math.min(14, 2 + Math.floor(id / 4)); // longer over time
    const wallDensity = clamp01(0.08 + t * 0.28); // denser mazes
    const requiredScore = Math.min(18, 3 + Math.floor(id / 5) + (id >= 30 ? 2 : 0));
    const coinCount = Math.min(14, requiredScore + 2);

    return {
      id,
      name: `Level ${id}`,
      gridSize,
      snakeSpeed,
      wallDensity,
      snakeLength,
      coinCount,
      requiredScore,
      walls: []
    };
  });
}

const LEVELS = makeLevels();

function keyOf(r, c) {
  return `${r},${c}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function posEq(a, b) {
  return a.r === b.r && a.c === b.c;
}

function manhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomEmptyCell({
  walls,
  occupied,
  rows,
  cols,
  minDistFrom = null,
  tries = 200
}) {
  for (let i = 0; i < tries; i++) {
    const r = randInt(1, rows - 2);
    const c = randInt(1, cols - 2);
    const k = keyOf(r, c);
    if (walls.has(k)) continue;
    if (occupied.has(k)) continue;
    if (minDistFrom && manhattan({ r, c }, minDistFrom.pos) < minDistFrom.dist)
      continue;
    return { r, c };
  }
  // fallback: scan
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const k = keyOf(r, c);
      if (!walls.has(k) && !occupied.has(k)) return { r, c };
    }
  }
  return { r: 1, c: 1 };
}

function buildWalls({
  player,
  snake,
  rows,
  cols,
  density = 0.18,
  manualWalls = []
}) {
  const walls = new Set();

  // Border walls
  for (let r = 0; r < rows; r++) {
    walls.add(keyOf(r, 0));
    walls.add(keyOf(r, cols - 1));
  }
  for (let c = 0; c < cols; c++) {
    walls.add(keyOf(0, c));
    walls.add(keyOf(rows - 1, c));
  }

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (Math.random() < density) walls.add(keyOf(r, c));
    }
  }
  for (const w of manualWalls) {
    if (w.r > 0 && w.r < rows - 1 && w.c > 0 && w.c < cols - 1) {
      walls.add(keyOf(w.r, w.c));
    }
  }

  // Ensure spawn zones are open
  walls.delete(keyOf(player.r, player.c));
  for (const seg of snake) walls.delete(keyOf(seg.r, seg.c));

  // Make a little breathing space around spawns
  const safe = [
    player,
    ...snake,
    { r: player.r + 1, c: player.c },
    { r: player.r, c: player.c + 1 },
    { r: snake[0].r - 1, c: snake[0].c },
    { r: snake[0].r, c: snake[0].c - 1 }
  ].map((p) => ({ r: clamp(p.r, 1, rows - 2), c: clamp(p.c, 1, cols - 2) }));

  for (const p of safe) walls.delete(keyOf(p.r, p.c));

  return walls;
}

function neighbors4(p, rows, cols) {
  return [
    { r: p.r - 1, c: p.c },
    { r: p.r + 1, c: p.c },
    { r: p.r, c: p.c - 1 },
    { r: p.r, c: p.c + 1 }
  ].filter((q) => q.r >= 0 && q.r < rows && q.c >= 0 && q.c < cols);
}

function nextSnakeHead({ snake, player, walls, rows, cols }) {
  const head = snake[0];
  const bodySet = new Set(snake.map((s) => keyOf(s.r, s.c)));

  const options = neighbors4(head, rows, cols)
    .filter((p) => !walls.has(keyOf(p.r, p.c)))
    .filter((p) => !bodySet.has(keyOf(p.r, p.c)));

  if (!options.length) return head;

  // Greedy Manhattan step, but if tied choose with slight randomness
  let best = [];
  let bestScore = Infinity;
  for (const p of options) {
    const score = manhattan(p, player);
    if (score < bestScore) {
      bestScore = score;
      best = [p];
    } else if (score === bestScore) {
      best.push(p);
    }
  }
  return best[randInt(0, best.length - 1)];
}

function stepSnake({ snake, player, walls, snakeLength, rows, cols }) {
  const newHead = nextSnakeHead({ snake, player, walls, rows, cols });
  const grown = [newHead, ...snake];
  return grown.slice(0, snakeLength);
}

function tryMovePlayer({ player, delta, walls, rows, cols }) {
  const to = {
    r: clamp(player.r + delta.r, 0, rows - 1),
    c: clamp(player.c + delta.c, 0, cols - 1)
  };
  if (walls.has(keyOf(to.r, to.c))) return player;
  return to;
}

function makeInitialState(level) {
  const rows = level.gridSize;
  const cols = level.gridSize;
  const player = { r: 1, c: 1 };
  const head = { r: rows - 2, c: cols - 2 };
  const snake = Array.from({ length: level.snakeLength }, (_, i) => ({
    r: head.r,
    c: clamp(head.c - i, 1, cols - 2)
  }));
  const walls = buildWalls({
    player,
    snake,
    rows,
    cols,
    density: level.wallDensity,
    manualWalls: level.walls
  });

  const occupied = new Set([keyOf(player.r, player.c), ...snake.map((s) => keyOf(s.r, s.c))]);
  const portal = pickRandomEmptyCell({
    walls,
    occupied,
    rows,
    cols,
    minDistFrom: { pos: player, dist: 10 }
  });
  occupied.add(keyOf(portal.r, portal.c));

  const coins = [];
  for (let i = 0; i < level.coinCount; i++) {
    const coin = pickRandomEmptyCell({ walls, occupied, rows, cols });
    coins.push(coin);
    occupied.add(keyOf(coin.r, coin.c));
  }

  return { rows, cols, player, snake, walls, portal, coins };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("loading");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [score, setScore] = useState(0);
  const [scorePopKey, setScorePopKey] = useState(0);
  const [combo, setCombo] = useState(1);
  const [comboText, setComboText] = useState("");
  const [playerSkinId, setPlayerSkinId] = useState("cyan");
  const [loadingFill, setLoadingFill] = useState(0);
  const [hasStartedFade, setHasStartedFade] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [trail, setTrail] = useState(() => new Map());
  const [powerUps, setPowerUps] = useState([]);
  const [shieldCount, setShieldCount] = useState(0);
  const [speedBoostUntil, setSpeedBoostUntil] = useState(0);
  const [freezeSnakeUntil, setFreezeSnakeUntil] = useState(0);
  const [dangerPulse, setDangerPulse] = useState(false);
  const [particles, setParticles] = useState([]);
  const [levelElapsedSec, setLevelElapsedSec] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);
  const [snakeBoostUntil, setSnakeBoostUntil] = useState(0);

  const levelConfig = LEVELS[currentLevel - 1] ?? LEVELS[0];
  const [baseTickMs, setBaseTickMs] = useState(levelConfig.snakeSpeed);
  const [world, setWorld] = useState(() => makeInitialState(LEVELS[0]));
  const { rows, cols, player, snake, walls, portal, coins } = world;

  const snakeStartAtRef = useRef(0);
  const lastCoinAtRef = useRef(0);

  const phaseRef = useRef(currentScreen);
  useEffect(() => {
    phaseRef.current = currentScreen;
  }, [currentScreen]);

  // Loading -> menu.
  useEffect(() => {
    setLoadingFill(0);
    const bar = window.setInterval(() => {
      setLoadingFill((v) => (v >= LOADING_BLOCKS ? LOADING_BLOCKS : v + 1));
    }, Math.floor(LOADING_MS / (LOADING_BLOCKS + 2)));
    const t1 = window.setTimeout(() => setHasStartedFade(true), LOADING_MS - 250);
    const t2 = window.setTimeout(() => setCurrentScreen("menu"), LOADING_MS);
    return () => {
      window.clearInterval(bar);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Tiny WebAudio beeps (no external assets).
  const audioRef = useRef(null);
  function beep({ freq = 440, dur = 0.06, type = "square", vol = 0.05 }) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      o.start(now);
      o.stop(now + dur);
    } catch {
      // ignore audio failures
    }
  }

  // Lightweight background music pulse.
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const id = window.setInterval(() => {
      const nearDanger = manhattan(player, snake[0]) <= 3;
      beep({
        freq: nearDanger ? 180 : 220,
        dur: 0.09,
        type: "triangle",
        vol: 0.015
      });
    }, 900);
    return () => window.clearInterval(id);
  }, [currentScreen, player, snake]);

  // Keyboard controls.
  useEffect(() => {
    function onKeyDown(e) {
      if (phaseRef.current !== "playing") return;

      const delta =
        e.key === "ArrowUp"
          ? { r: -1, c: 0 }
          : e.key === "ArrowDown"
            ? { r: 1, c: 0 }
            : e.key === "ArrowLeft"
              ? { r: 0, c: -1 }
              : e.key === "ArrowRight"
                ? { r: 0, c: 1 }
                : null;

      if (!delta) return;
      e.preventDefault();

      // Slight delay for "feel" (still responsive).
      window.setTimeout(() => {
        setWorld((prev) => {
          const from = prev.player;
          const nextPlayer = tryMovePlayer({
            player: prev.player,
            delta,
            walls: prev.walls,
            rows: prev.rows,
            cols: prev.cols
          });
          if (!posEq(from, nextPlayer)) {
            beep({ freq: 520, dur: 0.035, type: "square", vol: 0.04 });

            // Add trail at previous location
            setTrail((t) => {
              const nt = new Map(t);
              nt.set(keyOf(from.r, from.c), 1);
              return nt;
            });
          }
          return { ...prev, player: nextPlayer };
        });
      }, Date.now() < speedBoostUntil ? 24 : PLAYER_DELAY_MS);
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Trail decay (lightweight).
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const id = window.setInterval(() => {
      setTrail((t) => {
        if (!t.size) return t;
        const nt = new Map();
        for (const [k, v] of t.entries()) {
          const nv = v - 0.22;
          if (nv > 0.05) nt.set(k, nv);
        }
        return nt;
      });
    }, TRAIL_DECAY_MS);
    return () => window.clearInterval(id);
  }, [currentScreen]);

  // Level timer and combo timeout.
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const t = window.setInterval(() => {
      setLevelElapsedSec((s) => s + 1);
      if (combo > 1 && Date.now() - lastCoinAtRef.current > COMBO_WINDOW_MS) {
        setCombo(1);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [currentScreen, combo]);

  // Danger indicator (near snake).
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const near = manhattan(player, snake[0]) <= 3;
    setDangerPulse(near);
    if (near) {
      setShakeKey((k) => k + 1);
    }
  }, [player, snake, currentScreen]);

  // Particles decay.
  useEffect(() => {
    if (!particles.length) return;
    const id = window.setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, ttl: p.ttl - 120 }))
          .filter((p) => p.ttl > 0)
      );
    }, 120);
    return () => window.clearInterval(id);
  }, [particles]);

  // Random power-up spawns while playing.
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const id = window.setInterval(() => {
      setPowerUps((prev) => {
        if (prev.length >= 2 || Math.random() > 0.35) return prev;
        const occupied = new Set([
          keyOf(player.r, player.c),
          ...snake.map((s) => keyOf(s.r, s.c)),
          ...(portal ? [keyOf(portal.r, portal.c)] : []),
          ...coins.map((c) => keyOf(c.r, c.c)),
          ...prev.map((p) => keyOf(p.r, p.c))
        ]);
        const pos = pickRandomEmptyCell({ walls, occupied, rows, cols });
        const types = ["speed", "freeze", "shield"];
        const type = types[randInt(0, types.length - 1)];
        return [...prev, { id: Date.now() + Math.random(), ...pos, type }];
      });
    }, 7000);
    return () => window.clearInterval(id);
  }, [currentScreen, player, snake, portal, coins, walls, rows, cols]);

  // Random events: walls shift / extra coin / snake speed boost.
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const id = window.setInterval(() => {
      if (Math.random() > 0.26) return;
      const eventType = randInt(0, 2);
      if (eventType === 0) {
        setWorld((prev) => {
          const newWalls = new Set(prev.walls);
          for (let i = 0; i < 6; i++) {
            const r = randInt(1, prev.rows - 2);
            const c = randInt(1, prev.cols - 2);
            const k = keyOf(r, c);
            const occupied = new Set([
              keyOf(prev.player.r, prev.player.c),
              ...prev.snake.map((s) => keyOf(s.r, s.c)),
              ...prev.coins.map((c2) => keyOf(c2.r, c2.c)),
              ...(prev.portal ? [keyOf(prev.portal.r, prev.portal.c)] : [])
            ]);
            if (occupied.has(k)) continue;
            if (newWalls.has(k)) newWalls.delete(k);
            else newWalls.add(k);
          }
          return { ...prev, walls: newWalls };
        });
      } else if (eventType === 1) {
        setWorld((prev) => {
          const occupied = new Set([
            keyOf(prev.player.r, prev.player.c),
            ...prev.snake.map((s) => keyOf(s.r, s.c)),
            ...prev.coins.map((c) => keyOf(c.r, c.c)),
            ...(prev.portal ? [keyOf(prev.portal.r, prev.portal.c)] : [])
          ]);
          const newCoin = pickRandomEmptyCell({
            walls: prev.walls,
            occupied,
            rows: prev.rows,
            cols: prev.cols
          });
          return { ...prev, coins: [...prev.coins, newCoin] };
        });
      } else {
        setSnakeBoostUntil(Date.now() + 4000);
      }
    }, 9500);
    return () => window.clearInterval(id);
  }, [currentScreen]);

  // Game tick (snake moves every ~300ms).
  useEffect(() => {
    if (currentScreen !== "playing") return;

    const snakeTickMs =
      Date.now() < snakeBoostUntil ? Math.max(95, Math.floor(baseTickMs * 0.7)) : baseTickMs;

    const id = window.setInterval(() => {
      setWorld((prev) => {
        if (Date.now() < snakeStartAtRef.current) return prev;
        if (Date.now() < freezeSnakeUntil) return prev;

        const nextSnake = stepSnake({
          snake: prev.snake,
          player: prev.player,
          walls: prev.walls,
          snakeLength: levelConfig.snakeLength,
          rows: prev.rows,
          cols: prev.cols
        });

        if (nextSnake.some((seg) => posEq(seg, prev.player))) {
          if (shieldCount > 0) {
            setShieldCount((s) => Math.max(0, s - 1));
            beep({ freq: 360, dur: 0.08, type: "square", vol: 0.05 });
            setShakeKey((k) => k + 1);
            return { ...prev, snake: nextSnake };
          }
          // Move into player = game over
          window.setTimeout(() => setCurrentScreen("gameOver"), 0);
          window.setTimeout(() => setShakeKey((k) => k + 1), 0);
          beep({ freq: 140, dur: 0.14, type: "sawtooth", vol: 0.05 });
          // stronger game-over tone
          window.setTimeout(
            () => beep({ freq: 110, dur: 0.18, type: "sawtooth", vol: 0.06 }),
            120
          );
        }

        return { ...prev, snake: nextSnake };
      });
    }, snakeTickMs);

    return () => window.clearInterval(id);
  }, [
    currentScreen,
    baseTickMs,
    levelConfig.snakeLength,
    freezeSnakeUntil,
    shieldCount,
    snakeBoostUntil
  ]);

  // Handle coin collection / portal win when player moves.
  useEffect(() => {
    if (currentScreen !== "playing") return;

    const pKey = keyOf(player.r, player.c);
    const portalVisible = score >= levelConfig.requiredScore;
    const portalKey = portalVisible && portal ? keyOf(portal.r, portal.c) : null;
    if (portalKey && pKey === portalKey) {
      const bonus = Math.max(0, 120 - levelElapsedSec * 3);
      const finalScore = score + bonus;
      setTimeBonus(bonus);
      setScore(finalScore);
      setCurrentScreen("win");
      setUnlockedLevels((prev) => Math.max(prev, Math.min(LEVELS.length, currentLevel + 1)));
      beep({ freq: 660, dur: 0.08, type: "square", vol: 0.05 });
      window.setTimeout(() => beep({ freq: 880, dur: 0.09, type: "square", vol: 0.05 }), 90);
      setParticles((prev) => [
        ...prev,
        { id: Date.now(), r: portal.r, c: portal.c, ttl: 900, color: "#22d3ee" },
        { id: Date.now() + 1, r: portal.r, c: portal.c, ttl: 900, color: "#a855f7" }
      ]);
      return;
    }

    const hitIdx = coins.findIndex((c) => keyOf(c.r, c.c) === pKey);
    if (hitIdx !== -1) {
      setWorld((prev) => {
        const nextCoins = prev.coins.slice();
        nextCoins.splice(hitIdx, 1);

        // Respawn a new coin to keep it addictive
        const occupied = new Set([
          keyOf(prev.player.r, prev.player.c),
          ...prev.snake.map((s) => keyOf(s.r, s.c)),
          ...(prev.portal ? [keyOf(prev.portal.r, prev.portal.c)] : []),
          ...nextCoins.map((c) => keyOf(c.r, c.c))
        ]);
        const newCoin = pickRandomEmptyCell({
          walls: prev.walls,
          occupied,
          rows: prev.rows,
          cols: prev.cols
        });
        nextCoins.push(newCoin);
        return { ...prev, coins: nextCoins };
      });

      const now = Date.now();
      const fast = now - lastCoinAtRef.current <= COMBO_WINDOW_MS;
      const nextCombo = fast ? Math.min(5, combo + 1) : 1;
      lastCoinAtRef.current = now;
      setCombo(nextCombo);
      const gained = 10 * nextCombo;
      setScore((s) => s + gained);
      setScorePopKey((k) => k + 1);
      if (nextCombo > 1) {
        setComboText(`COMBO x${nextCombo}!`);
        window.setTimeout(() => setComboText(""), 700);
      }
      beep({ freq: 740, dur: 0.06, type: "triangle", vol: 0.05 });
      setParticles((prev) => [
        ...prev,
        { id: now + Math.random(), r: player.r, c: player.c, ttl: 600, color: "#facc15" }
      ]);
    }
  }, [
    player,
    coins,
    currentScreen,
    currentLevel,
    score,
    levelConfig.requiredScore,
    combo,
    levelElapsedSec,
    portal
  ]);

  // Handle power-up collection.
  useEffect(() => {
    if (currentScreen !== "playing") return;
    const pKey = keyOf(player.r, player.c);
    const hit = powerUps.find((p) => keyOf(p.r, p.c) === pKey);
    if (!hit) return;
    setPowerUps((prev) => prev.filter((p) => p.id !== hit.id));
    if (hit.type === "speed") {
      setSpeedBoostUntil(Date.now() + 3000);
    } else if (hit.type === "freeze") {
      setFreezeSnakeUntil(Date.now() + 2600);
    } else if (hit.type === "shield") {
      setShieldCount((s) => s + 1);
    }
    beep({ freq: 510, dur: 0.1, type: "triangle", vol: 0.05 });
  }, [player, powerUps, currentScreen]);

  function startLevel(levelNumber) {
    const level = LEVELS[levelNumber - 1] ?? LEVELS[0];
    setCurrentLevel(level.id);
    setBaseTickMs(level.snakeSpeed);
    setWorld(makeInitialState(level));
    setTrail(new Map());
    setScore(0);
    setCombo(1);
    setComboText("");
    setPowerUps([]);
    setShieldCount(0);
    setSpeedBoostUntil(0);
    setFreezeSnakeUntil(0);
    setSnakeBoostUntil(0);
    setLevelElapsedSec(0);
    setTimeBonus(0);
    snakeStartAtRef.current = Date.now() + SNAKE_START_DELAY_MS;
    setCurrentScreen("playing");
  }

  function retryLevel() {
    startLevel(currentLevel);
  }

  function goToMenu() {
    setCurrentScreen("menu");
  }

  function nextLevel() {
    const next = Math.min(LEVELS.length, currentLevel + 1);
    startLevel(next);
  }

  function randomizeMazeForCurrentLevel() {
    const level = LEVELS[currentLevel - 1] ?? LEVELS[0];
    setWorld((prev) => {
      const nextWalls = buildWalls({
        player: prev.player,
        snake: prev.snake,
        rows: prev.rows,
        cols: prev.cols,
        density: level.wallDensity,
        manualWalls: level.walls
      });
      const occupied = new Set([
        keyOf(prev.player.r, prev.player.c),
        ...prev.snake.map((s) => keyOf(s.r, s.c))
      ]);
      const nextPortal = pickRandomEmptyCell({
        walls: nextWalls,
        occupied,
        rows: prev.rows,
        cols: prev.cols,
        minDistFrom: { pos: prev.player, dist: 8 }
      });
      occupied.add(keyOf(nextPortal.r, nextPortal.c));
      const nextCoins = [];
      for (let i = 0; i < level.coinCount; i++) {
        const coin = pickRandomEmptyCell({
          walls: nextWalls,
          occupied,
          rows: prev.rows,
          cols: prev.cols
        });
        nextCoins.push(coin);
        occupied.add(keyOf(coin.r, coin.c));
      }
      return {
        ...prev,
        walls: nextWalls,
        portal: nextPortal,
        coins: nextCoins
      };
    });
    setTrail(new Map());
    setScore(0);
    setCombo(1);
    setComboText("");
    setPowerUps([]);
    setShieldCount(0);
    setSpeedBoostUntil(0);
    setFreezeSnakeUntil(0);
    setSnakeBoostUntil(0);
    setBaseTickMs(levelConfig.snakeSpeed);
    setLevelElapsedSec(0);
    setTimeBonus(0);
    snakeStartAtRef.current = Date.now() + SNAKE_START_DELAY_MS;
  }

  if (currentScreen === "loading") {
    return (
      <div
        className="h-screen bg-black"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      >
        <div
          className={`relative flex h-screen items-center justify-center px-6 transition-opacity duration-300 ${
            hasStartedFade ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Title must be EXACTLY screen-center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-mono">
            <div className="text-6xl font-black tracking-widest sm:text-7xl">
              {"SNAKE MAN".split("").map((ch, idx) => {
                if (ch === " ") {
                  return <span key={idx} className="inline-block w-4 sm:w-6" />;
                }
                return (
                  <span
                    key={idx}
                    className="mx-[2px] inline-block select-none rounded-[6px] border border-black/60 bg-gradient-to-b from-emerald-300 to-emerald-700 px-2 py-1 text-slate-950 shadow-[4px_4px_0px_#000] sm:px-3 sm:py-1.5"
                    style={{
                      textShadow: "0 1px 0 rgba(255,255,255,0.25)"
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Subtitle + loading bar below the centered title */}
          <div className="absolute left-1/2 top-1/2 mt-24 -translate-x-1/2 text-center font-mono sm:mt-28">
            <div className="text-sm font-bold tracking-wide text-gray-400">
              <span className="inline-block animate-pulse">
                Loading World<span className="opacity-70">...</span>
              </span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              {Array.from({ length: LOADING_BLOCKS }).map((_, i) => {
                const filled = i < loadingFill;
                return (
                  <div
                    key={i}
                    className={`h-3.5 w-3.5 rounded-[2px] transition-colors duration-150 ${
                      filled
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                        : "bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "menu") {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#020617] to-[#0f172a]">
        <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center px-4 py-10">
          <LevelSelect
            levels={LEVELS}
            unlockedLevels={unlockedLevels}
            playerSkinId={playerSkinId}
            skins={PLAYER_SKINS}
            onSelectSkin={(id) => setPlayerSkinId(id)}
            onSelectLevel={(id) => startLevel(id)}
          />
        </div>
      </div>
    );
  }

  const playerSkin = PLAYER_SKINS.find((s) => s.id === playerSkinId) ?? PLAYER_SKINS[0];
  const requiredCoins = levelConfig.requiredScore;
  const scoreUnits = Math.floor(score / 10);
  const portalVisible = scoreUnits >= requiredCoins;
  const dangerDistance = manhattan(player, snake[0]);
  const dangerKeys =
    dangerDistance <= 3
      ? new Set(
          neighbors4(snake[0], rows, cols)
            .concat([snake[0]])
            .map((p) => keyOf(p.r, p.c))
        )
      : new Set();
  const particleMap = new Map();
  for (const p of particles) {
    const k = keyOf(p.r, p.c);
    particleMap.set(k, (particleMap.get(k) ?? 0) + 1);
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-[#020617] to-[#0f172a]">
      <div
        key={shakeKey}
        className={`mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-10 transition-colors duration-300 ${
          currentScreen === "gameOver" || dangerPulse ? "sm-shake" : ""
        }`}
      >
        <header className="w-full max-w-3xl">
          <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/55 p-5 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
                Snake Man - {levelConfig.name}
              </h1>
              <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
                Playing
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Grab coins, then reach the portal — don’t let the snake touch you.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {shieldCount > 0 ? (
                <span className="rounded-full bg-sky-500/15 px-2 py-1 font-semibold text-sky-200 ring-1 ring-sky-400/30">
                  Shield x{shieldCount}
                </span>
              ) : null}
              {Date.now() < speedBoostUntil ? (
                <span className="rounded-full bg-purple-500/15 px-2 py-1 font-semibold text-purple-200 ring-1 ring-purple-400/30">
                  Speed Boost
                </span>
              ) : null}
              {Date.now() < freezeSnakeUntil ? (
                <span className="rounded-full bg-cyan-500/15 px-2 py-1 font-semibold text-cyan-200 ring-1 ring-cyan-400/30">
                  Snake Frozen
                </span>
              ) : null}
              {Date.now() < snakeBoostUntil ? (
                <span className="rounded-full bg-rose-500/15 px-2 py-1 font-semibold text-rose-200 ring-1 ring-rose-400/30">
                  Snake Frenzy
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <Controls
          phase={currentScreen}
          score={scoreUnits}
          requiredScore={requiredCoins}
          speedMs={baseTickMs}
          scorePopKey={scorePopKey}
          onRestart={retryLevel}
          onNewMaze={randomizeMazeForCurrentLevel}
          onMenu={goToMenu}
        />

        <main className="relative w-full max-w-3xl">
          <div className="flex flex-col items-center gap-4">
            <Grid
              rows={rows}
              cols={cols}
              player={player}
              snake={snake}
              walls={walls}
              coins={coins}
              portal={portalVisible ? portal : null}
              trail={trail}
              playerHex={playerSkin.hex}
              powerUps={powerUps}
              dangerKeys={dangerKeys}
              particleMap={particleMap}
            />
            {comboText ? (
              <div className="text-sm font-extrabold text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                {comboText}
              </div>
            ) : null}
            <div className="text-xs text-slate-400">
              Tip: Collect {requiredCoins} coins to spawn the portal, then escape.
            </div>
          </div>

          {currentScreen === "gameOver" ? (
            <GameOver onRetry={retryLevel} onMenu={goToMenu} />
          ) : currentScreen === "win" ? (
            <WinScreen
              level={currentLevel}
              finalScore={score}
              timeBonus={timeBonus}
              stars={scoreUnits >= requiredCoins + 8 ? 3 : scoreUnits >= requiredCoins + 4 ? 2 : 1}
              hasNextLevel={currentLevel < LEVELS.length}
              onNextLevel={nextLevel}
              onMenu={goToMenu}
              onReplay={retryLevel}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

