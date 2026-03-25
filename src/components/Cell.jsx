export default function Cell({
  kind,
  snakePart,
  intensity = 1,
  playerHex,
  danger,
  particleCount = 0
}) {
  const base =
    "relative w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-all duration-200 ease-in-out";
  const dangerRing = danger
    ? "ring-1 ring-rose-400/35 shadow-[0_0_10px_rgba(248,113,113,0.28)]"
    : "";

  if (kind === "wall") {
    return <div className={`${base} bg-[#1e293b] ${dangerRing}`} />;
  }

  if (kind === "player") {
    const hex = playerHex || "#22d3ee";
    return (
      <div
        className={`${base} rounded-full ring-2 ring-white/30 sm-pop ${dangerRing}`}
        style={{
          background: hex,
          boxShadow: `0 0 18px ${hex}77`
        }}
      />
    );
  }

  if (kind === "snake") {
    const cls =
      snakePart === "head"
        ? "bg-gradient-to-b from-emerald-300 to-emerald-700 shadow-[0_0_18px_rgba(34,197,94,0.55)] ring-1 ring-emerald-200/40 animate-pulse"
        : "bg-gradient-to-b from-emerald-200 to-emerald-600 shadow-[0_0_10px_rgba(74,222,128,0.18)]";
    return <div className={`${base} rounded-full ${cls} ${dangerRing}`} />;
  }

  if (kind === "trail") {
    const hex = playerHex || "#22d3ee";
    const a = Math.max(0.08, Math.min(0.35, 0.08 + 0.27 * intensity));
    return (
      <div
        className={`${base} rounded-full ${dangerRing}`}
        style={{
          background: hex,
          opacity: a,
          boxShadow: `0 0 14px ${hex}66`
        }}
      />
    );
  }

  if (kind === "coin") {
    return (
      <div
        className={`${base} rounded-full bg-[#facc15] shadow-[0_0_14px_rgba(250,204,21,0.45)] ring-1 ring-yellow-100/50 ${dangerRing}`}
      />
    );
  }

  if (kind === "portal") {
    return (
      <div
        className={`${base} rounded-lg bg-gradient-to-br from-fuchsia-500/90 to-cyan-300/90 shadow-[0_0_22px_rgba(34,211,238,0.55)] ring-2 ring-cyan-200/30 animate-pulse ${dangerRing}`}
      />
    );
  }

  if (kind === "power-speed") {
    return (
      <div className={`${base} rounded-lg bg-purple-400/90 shadow-[0_0_14px_rgba(192,132,252,0.45)] ring-1 ring-purple-100/50 ${dangerRing}`}>
        <div className="absolute inset-0 grid place-items-center text-[10px] font-black text-slate-950">
          ⚡
        </div>
      </div>
    );
  }

  if (kind === "power-freeze") {
    return (
      <div className={`${base} rounded-lg bg-cyan-300/90 shadow-[0_0_14px_rgba(34,211,238,0.45)] ring-1 ring-cyan-100/60 ${dangerRing}`}>
        <div className="absolute inset-0 grid place-items-center text-[10px] font-black text-slate-950">
          ❄
        </div>
      </div>
    );
  }

  if (kind === "power-shield") {
    return (
      <div className={`${base} rounded-lg bg-sky-400/90 shadow-[0_0_14px_rgba(56,189,248,0.45)] ring-1 ring-sky-100/60 ${dangerRing}`}>
        <div className="absolute inset-0 grid place-items-center text-[10px] font-black text-slate-950">
          ⛨
        </div>
      </div>
    );
  }

  // empty
  return (
    <div className={`${base} bg-[#0f172a] ${dangerRing}`}>
      {particleCount > 0 ? (
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-yellow-200/90 animate-ping" />
          <span className="absolute right-1.5 top-2 h-1 w-1 rounded-full bg-cyan-200/80 animate-ping" />
          <span className="absolute bottom-1.5 left-2 h-1 w-1 rounded-full bg-fuchsia-200/80 animate-ping" />
        </div>
      ) : null}
    </div>
  );
}

