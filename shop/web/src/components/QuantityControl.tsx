export default function QuantityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="qty">
      <button className="btn btn--ghost" onClick={() => onChange(value - 1)}>-</button>
      <input
        className="qty__input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 1))}
        inputMode="numeric"
      />
      <button className="btn btn--ghost" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
