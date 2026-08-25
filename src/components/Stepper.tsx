interface StepperProps {
  /** Human-readable name of what this stepper controls, e.g. "total players".
   *  Used to build the decrement/increment aria-labels. */
  label: string
  value: string | number
  onDecrement: () => void
  onIncrement: () => void
}

function Stepper({ label, value, onDecrement, onIncrement }: StepperProps) {
  return (
    <div className="stepper">
      <button
        className="stepper__btn"
        type="button"
        onClick={onDecrement}
        aria-label={`Decrease ${label}`}
      >
        &minus;
      </button>
      <span className="stepper__value">{value}</span>
      <button
        className="stepper__btn"
        type="button"
        onClick={onIncrement}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  )
}

export default Stepper
