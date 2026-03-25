export default function LevelSelect({
  levels,
  unlockedLevels,
  playerSkinId,
  skins,
  onSelectSkin,
  onSelectLevel
}) {
  return (
    <div className="w-full max-w-3xl rounded-3xl bg-slate-900/60 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white">Select Level</h2>
        <p className="mt-2 text-sm text-slate-300">
          Beat levels to unlock harder challenges.
        </p>
      </div>

      <div className="mt-7 rounded-2xl bg-slate-950/35 p-4 ring-1 ring-white/10">
        <div className="text-xs font-semibold text-slate-300">Player Color</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {skins.map((s) => {
            const active = s.id === playerSkinId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSkin(s.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-200 ${
                  active
                    ? "bg-white/10 ring-2 ring-cyan-300/40"
                    : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full ring-2 ring-white/20"
                  style={{ background: s.hex, boxShadow: `0 0 14px ${s.hex}55` }}
                />
                <span className="text-slate-100">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-center text-sm font-semibold text-slate-200">
          Levels
        </div>
        <div className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950/35 p-4 ring-1 ring-white/10">
          <div className="grid grid-cols-6 gap-3">
            {levels.map((level) => {
              const unlocked = level.id <= unlockedLevels;
              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onSelectLevel(level.id)}
                  className={`relative rounded-xl px-0 py-3 text-sm font-extrabold transition-all duration-200 ${
                    unlocked
                      ? "bg-slate-900/60 text-white ring-1 ring-cyan-300/20 hover:scale-[1.05] hover:ring-cyan-300/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.22)]"
                      : "cursor-not-allowed bg-slate-900/30 text-slate-400 ring-1 ring-white/10 opacity-60"
                  }`}
                  title={unlocked ? `Play Level ${level.id}` : `Locked`}
                >
                  {level.id}
                  {!unlocked ? (
                    <span className="absolute right-2 top-2 text-[10px] opacity-80">
                      🔒
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

