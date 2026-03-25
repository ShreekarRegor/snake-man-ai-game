export default function Controls({
  phase,
  score,
  requiredScore,
  speedMs,
  scorePopKey,
  onRestart,
  onNewMaze,
  onMenu
}) {
  const isGameOver = phase === "gameOver";
  return (
    <div className="w-full max-w-3xl rounded-2xl bg-slate-900/55 p-4 shadow-xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNewMaze}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-indigo-400 hover:shadow-[0_0_18px_rgba(99,102,241,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            New Maze
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-[0_0_18px_rgba(148,163,184,0.25)] focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-slate-700 hover:shadow-[0_0_18px_rgba(148,163,184,0.2)] focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Menu
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/40 px-3 py-2 ring-1 ring-white/10">
            <div className="text-xs font-semibold text-slate-300">Score</div>
            <div
              key={scorePopKey}
              className={`text-sm font-extrabold text-yellow-200 ${
                scorePopKey ? "sm-pop" : ""
              }`}
            >
              {score} / {requiredScore}
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-300 ring-1 ring-white/10 sm:flex">
            <span>Speed</span>
            <span className="font-extrabold text-slate-100">{speedMs}ms</span>
          </div>

          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              isGameOver
                ? "bg-rose-500/15 text-rose-200 ring-rose-500/30"
                : "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
            }`}
          >
            {isGameOver ? "Caught" : "Escape"}
          </span>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-300">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="font-semibold text-yellow-300">Player</span>: arrow
            keys
          </span>
          <span>
            <span className="font-semibold text-emerald-300">Snake</span>: moves
            every ~300ms
          </span>
          <span>
            <span className="font-semibold text-slate-200">Walls</span>: block
            both
          </span>
          <span>
            <span className="font-semibold text-cyan-200">Portal</span>: reach to
            win
          </span>
        </div>
      </div>
    </div>
  );
}

