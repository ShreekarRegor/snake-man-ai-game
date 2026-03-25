function keyOf(r, c) {
  return `${r},${c}`;
}

function parseKey(k) {
  const [r, c] = k.split(",").map(Number);
  return { r, c };
}

function inBounds(rows, cols, r, c) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

function neighbors4(rows, cols, r, c) {
  return [
    { r: r - 1, c },
    { r: r + 1, c },
    { r, c: c - 1 },
    { r, c: c + 1 }
  ].filter((p) => inBounds(rows, cols, p.r, p.c));
}

function reconstructPath(cameFrom, startKey, goalKey) {
  if (startKey === goalKey) return [parseKey(startKey)];
  if (!cameFrom.has(goalKey)) return [];
  const out = [];
  let cur = goalKey;
  while (cur !== undefined) {
    out.push(parseKey(cur));
    if (cur === startKey) break;
    cur = cameFrom.get(cur);
  }
  out.reverse();
  return out;
}

export function bfs({ grid, start, goal }) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const startKey = keyOf(start.r, start.c);
  const goalKey = keyOf(goal.r, goal.c);

  const visited = [];
  const q = [];
  const seen = new Set();
  const cameFrom = new Map();

  q.push(start);
  seen.add(startKey);

  while (q.length) {
    const cur = q.shift();
    const curKey = keyOf(cur.r, cur.c);
    visited.push(cur);

    if (curKey === goalKey) break;

    for (const nb of neighbors4(rows, cols, cur.r, cur.c)) {
      const nbKey = keyOf(nb.r, nb.c);
      if (seen.has(nbKey)) continue;
      if (grid[nb.r][nb.c].type === "wall") continue;
      seen.add(nbKey);
      cameFrom.set(nbKey, curKey);
      q.push(nb);
    }
  }

  const path = reconstructPath(cameFrom, startKey, goalKey);
  return { visited, path };
}

function manhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function astar({ grid, start, goal }) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const startKey = keyOf(start.r, start.c);
  const goalKey = keyOf(goal.r, goal.c);

  const visited = [];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const open = new Set([startKey]);
  gScore.set(startKey, 0);
  fScore.set(startKey, manhattan(start, goal));

  function lowestFInOpen() {
    let bestKey = null;
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        bestKey = k;
      }
    }
    return bestKey;
  }

  while (open.size) {
    const curKey = lowestFInOpen();
    if (!curKey) break;
    open.delete(curKey);
    const cur = parseKey(curKey);
    visited.push(cur);

    if (curKey === goalKey) break;

    for (const nb of neighbors4(rows, cols, cur.r, cur.c)) {
      if (grid[nb.r][nb.c].type === "wall") continue;
      const nbKey = keyOf(nb.r, nb.c);
      const tentativeG = (gScore.get(curKey) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(nbKey) ?? Infinity)) {
        cameFrom.set(nbKey, curKey);
        gScore.set(nbKey, tentativeG);
        fScore.set(nbKey, tentativeG + manhattan(nb, goal));
        open.add(nbKey);
      }
    }
  }

  const path = reconstructPath(cameFrom, startKey, goalKey);
  return { visited, path };
}

