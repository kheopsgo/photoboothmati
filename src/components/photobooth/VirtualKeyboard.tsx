import { useCallback } from "react";
import { Delete, CornerDownLeft } from "lucide-react";

const ROW1 = ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW2 = ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"];
const ROW3 = ["w", "x", "c", "v", "b", "n"];
const NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const SHORTCUTS = ["@gmail.com", "@hotmail.com", "@yahoo.fr", "@outlook.com"];

interface VirtualKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}

export default function VirtualKeyboard({ value, onChange, onSubmit, submitDisabled }: VirtualKeyboardProps) {
  const press = useCallback(
    (char: string) => onChange(value + char),
    [value, onChange]
  );

  const backspace = useCallback(
    () => onChange(value.slice(0, -1)),
    [value, onChange]
  );

  const appendShortcut = useCallback(
    (s: string) => {
      // If already has @, replace from @
      const atIdx = value.indexOf("@");
      const base = atIdx >= 0 ? value.slice(0, atIdx) : value;
      onChange(base + s);
    },
    [value, onChange]
  );

  const keyClass =
    "flex items-center justify-center rounded-lg bg-card border border-border text-foreground font-body active:scale-95 active:bg-muted transition-all duration-100 select-none touch-manipulation";

  return (
    <div className="w-full space-y-2">
      {/* Domain shortcuts */}
      <div className="flex gap-1.5 flex-wrap justify-center mb-3">
        {SHORTCUTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => appendShortcut(s)}
            className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-body text-sm active:scale-95 transition-all touch-manipulation hover:bg-primary/20"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Numbers */}
      <div className="flex gap-1 justify-center">
        {NUMBERS.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className={`${keyClass} h-10 w-[9.2%] text-base`}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 1 - AZERTY */}
      <div className="flex gap-1 justify-center">
        {ROW1.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className={`${keyClass} h-11 w-[9.2%] text-base`}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex gap-1 justify-center">
        {ROW2.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className={`${keyClass} h-11 w-[9.2%] text-base`}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 3 + special keys */}
      <div className="flex gap-1 justify-center">
        <button type="button" onClick={backspace} className={`${keyClass} h-11 w-[14%] bg-muted`}>
          <Delete size={20} />
        </button>
        {ROW3.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className={`${keyClass} h-11 w-[9.2%] text-base`}>
            {k}
          </button>
        ))}
        <button type="button" onClick={() => press(".")} className={`${keyClass} h-11 w-[9.2%] text-base font-bold`}>
          .
        </button>
        <button type="button" onClick={() => press("@")} className={`${keyClass} h-11 w-[9.2%] text-base text-primary font-bold`}>
          @
        </button>
      </div>

      {/* Bottom row: special + space + OK */}
      <div className="flex gap-1 justify-center mt-1">
        <button type="button" onClick={() => press("-")} className={`${keyClass} h-11 w-[9.2%] text-base`}>
          -
        </button>
        <button type="button" onClick={() => press("_")} className={`${keyClass} h-11 w-[9.2%] text-base`}>
          _
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none touch-manipulation"
        >
          <CornerDownLeft size={18} />
          OK
        </button>
      </div>
    </div>
  );
}
