export default function Stepper({ value, onMinus, onPlus, label, className = '' }) {
  return (
    <div className={`stepper ${className}`} role="group" aria-label={label}>
      <button type="button" onClick={onMinus} aria-label="Меньше">
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={onPlus} aria-label="Больше">
        +
      </button>
    </div>
  );
}
