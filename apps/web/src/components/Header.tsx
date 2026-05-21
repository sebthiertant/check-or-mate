interface HeaderProps {
  gameCount: number;
}

export function Header({ gameCount }: HeaderProps) {
  return (
    <header className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">♞</span>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
          check-or-mate
        </h1>
      </div>
      <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
        Spectacular chess games, curated by machine.{" "}
        <span className="text-zinc-600">
          Scored across seven dimensions — sacrifice, drama, brilliancy, clock
          pressure, endgame precision, rating upset, and opening rarity.
        </span>
      </p>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
        <Stat value={gameCount} label="games shown" />
        <Divider />
        <Stat value="7" label="scoring dimensions" />
        <Divider />
        <Stat value="Stockfish 16" label="analysis engine" />
      </div>
    </header>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-amber-400 font-mono font-semibold text-sm tabular-nums">
        {value}
      </span>
      <span className="text-zinc-600 text-xs">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="text-zinc-800">·</span>;
}
