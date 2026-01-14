export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const safeMin = Number.isFinite(min) ? min : 1;
  const safeMax = Number.isFinite(max) ? max : 999;
  const clampedMax = Math.max(safeMin, safeMax);

  return (
    <div className="qty">
      <button
        className="btn btn--ghost"
        disabled={value <= safeMin}
        onClick={() => onChange(Math.max(safeMin, value - 1))}
      >
        -
      </button>
      <input
        className="qty__input"
        value={value}
        onChange={(e) => {
          const raw = Number(e.target.value || safeMin);
          const next = Math.max(safeMin, Math.min(clampedMax, raw || safeMin));
          onChange(next);
        }}
        inputMode="numeric"
        type="number"
        min={safeMin}
        max={clampedMax}
      />
      <button
        className="btn btn--ghost"
        disabled={value >= clampedMax}
        onClick={() => onChange(Math.min(clampedMax, value + 1))}
      >
        +
      </button>
    </div>
  );
}
