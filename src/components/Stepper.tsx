interface StepperProps {
  /** Human-readable name of what this stepper controls, e.g. "total players".
   *  Used to build the decrement/increment aria-labels. */
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  /** Optional formatter for the displayed value, e.g. (s) => `${s}s` for a timer. */
  formatValue?: (value: number) => string
  onChange: (value: number) => void
}

function Stepper({
  label,
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  formatValue = String,
  onChange,
}: StepperProps) {
  function decrement() {
    onChange(Math.max(min, value - step))
  }

  function increment() {
    onChange(Math.min(max, value + step))
  }

  return (
    <div className="stepper">
      <button
        className="stepper__btn"
        type="button"
        onClick={decrement}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
      >
        &minus;
      </button>
      <span className="stepper__value">{formatValue(value)}</span>
      <button
        className="stepper__btn"
        type="button"
        onClick={increment}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}

export default Stepper
