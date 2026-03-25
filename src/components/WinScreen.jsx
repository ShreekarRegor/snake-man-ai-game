export default function WinScreen({
  level,
  finalScore,
  timeBonus,
  stars,
  hasNextLevel,
  onNextLevel,
  onMenu,
  onReplay
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-slate-950/75 p-6 text-center shadow-2xl ring-1 ring-white/10">
        <div className="text-3xl font-extrabold text-white">Level Complete!</div>
        <div className="mt-2 text-sm text-slate-300">You escaped Level {level}.</div>
        <div className="mt-3 text-sm text-slate-300">
          Final score: <span className="font-extrabold text-yellow-200">{finalScore}</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">Time bonus: +{timeBonus}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`text-2xl transition-all duration-300 ${
                n <= stars ? "scale-100 text-yellow-300 animate-bounce" : "scale-90 text-slate-600"
              }`}
              style={{ animationDelay: `${n * 120}ms` }}
            >
              ★
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {hasNextLevel ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-400 hover:shadow-[0_0_22px_rgba(99,102,241,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Next Level
            </button>
          ) : (
            <button
              type="button"
              onClick={onReplay}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-400 hover:shadow-[0_0_22px_rgba(99,102,241,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Replay Level
            </button>
          )}
          <button
            type="button"
            onClick={onMenu}
            className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

