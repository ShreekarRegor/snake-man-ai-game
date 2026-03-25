export default function GameOver({ onRetry, onMenu }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-slate-950/75 p-6 text-center shadow-2xl ring-1 ring-white/10">
        <div className="text-3xl font-extrabold text-white">You were caught!</div>
        <div className="mt-2 text-sm text-slate-300">
          The snake cornered you this time.
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-400 hover:shadow-[0_0_22px_rgba(34,197,94,0.35)] focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex-1 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

