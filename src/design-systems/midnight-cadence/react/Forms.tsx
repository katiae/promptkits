// Halyard form controls. Requires tokens/tokens.css and dist/forms.css.
import { useState, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";

type BoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode };

export function Checkbox({ label, ...props }: BoxProps) {
  return (
    <label className="hy-check">
      <input type="checkbox" {...props} />
      <span className="hy-check__box" />
      {label}
    </label>
  );
}

export function Radio({ label, ...props }: BoxProps) {
  return (
    <label className="hy-radio">
      <input type="radio" {...props} />
      <span className="hy-radio__dot" />
      {label}
    </label>
  );
}

export function Switch({ label, ...props }: BoxProps) {
  return (
    <label className="hy-switch">
      <input type="checkbox" role="switch" {...props} />
      <span className="hy-switch__track" />
      {label}
    </label>
  );
}

export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode }) {
  return (
    <label className="hy-field">
      <span className="hy-field__label">{label}</span>
      <select className="hy-select" {...props}>{children}</select>
    </label>
  );
}

const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function DatePicker({ value, onChange }: { value?: Date; onChange?: (d: Date) => void }) {
  const today = new Date();
  const [view, setView] = useState(new Date((value ?? today).getFullYear(), (value ?? today).getMonth(), 1));
  const [inner, setInner] = useState<Date | undefined>(value);
  const sel = value ?? inner;
  const start = (view.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i - start + 1));
  const shift = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  return (
    <div className="hy-date">
      <div className="hy-date__head">
        <button type="button" className="hy-date__nav" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
        {view.toLocaleString("en", { month: "long", year: "numeric" })}
        <button type="button" className="hy-date__nav" aria-label="Next month" onClick={() => shift(1)}>›</button>
      </div>
      <div className="hy-date__grid">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="hy-date__dow">{d}</span>)}
        {days.map((d) => (
          <button
            key={d.getTime()}
            type="button"
            className={["hy-date__day", d.getMonth() !== view.getMonth() && "is-muted", same(d, today) && "is-today", sel && same(d, sel) && "is-selected"].filter(Boolean).join(" ")}
            onClick={() => { setInner(d); onChange?.(d); }}
          >
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
