import Cell from "./Cell.jsx";

function keyOf(r, c) {
  return `${r},${c}`;
}

function posEq(a, b) {
  return a.r === b.r && a.c === b.c;
}

export default function Grid({
  rows,
  cols,
  player,
  snake,
  walls,
  coins,
  portal,
  trail,
  playerHex,
  powerUps,
  dangerKeys,
  particleMap
}) {
  const snakeSet = new Set(snake.map((s) => keyOf(s.r, s.c)));
  const headKey = keyOf(snake[0].r, snake[0].c);
  const coinSet = new Set(coins.map((p) => keyOf(p.r, p.c)));
  const powerMap = new Map(powerUps.map((p) => [keyOf(p.r, p.c), p.type]));

  return (
    <div
      className="inline-block rounded-2xl bg-slate-900/50 p-4 shadow-xl ring-1 ring-white/10 backdrop-blur"
      style={{ boxShadow: "0 0 40px rgba(0,255,255,0.2)" }}
    >
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: rows }).flatMap((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const k = keyOf(r, c);
            const isWall = walls.has(k);
            const isPlayer = posEq(player, { r, c });
            const isSnake = snakeSet.has(k);
            const isPortal = portal && posEq(portal, { r, c });
            const isCoin = coinSet.has(k);
            const trailIntensity = trail?.get(k);
            const snakePart = isSnake ? (k === headKey ? "head" : "body") : null;
            const powerType = powerMap.get(k);
            const danger = dangerKeys?.has(k);
            const particleCount = particleMap?.get(k) ?? 0;

            const kind = isWall
              ? "wall"
              : isPlayer
                ? "player"
                : isSnake
                  ? "snake"
                  : isPortal
                    ? "portal"
                    : powerType
                      ? `power-${powerType}`
                    : isCoin
                      ? "coin"
                      : trailIntensity
                        ? "trail"
                        : "empty";

            return (
              <Cell
                key={`${r}-${c}`}
                kind={kind}
                snakePart={snakePart}
                intensity={trailIntensity ?? 0}
                playerHex={playerHex}
                danger={danger}
                particleCount={particleCount}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

