type StatTileProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
};

export function StatTile({ label, value, hint, accent }: StatTileProps) {
  return (
    <div className="bg-sand-100 border-sand-200 rounded-[0.75rem] border px-3 py-2.5">
      <p className="pc-eyebrow">{label}</p>
      <p
        className="mt-1 text-xl font-extrabold leading-none tracking-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && <p className="text-ink-400 mt-1 text-[11px]">{hint}</p>}
    </div>
  );
}
