import { ChevronDown, ChevronUp } from "lucide-react";

function clampValue(value, min, max) {
    let next = value;
    if (min != null && next < Number(min)) next = Number(min);
    if (max != null && next > Number(max)) next = Number(max);
    return next;
}

function roundToStep(value, step) {
    const stepNum = Number(step) || 1;
    if (stepNum >= 1) return value;
    const decimals = String(stepNum).split(".")[1]?.length ?? 1;
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

export default function NumberInput({
    value,
    onChange,
    min,
    max,
    step = 1,
    className = "",
    inputClassName = "",
    disabled = false,
    placeholder,
    required,
    id,
    name,
}) {
    const bump = (direction) => {
        if (disabled) return;

        const stepNum = Number(step) || 1;
        const current = value === "" || value == null ? 0 : Number(value);
        if (Number.isNaN(current)) return;

        let next =
            direction === "up" ? current + stepNum : current - stepNum;
        next = roundToStep(next, step);
        next = clampValue(next, min, max);

        onChange?.(String(next));
    };

    const stepperVisibility =
        "pointer-events-none opacity-0 transition-opacity duration-200 " +
        "group-hover/number:pointer-events-auto group-hover/number:opacity-100 " +
        "group-focus-within/number:pointer-events-auto group-focus-within/number:opacity-100";

    return (
        <div className={`group/number relative ${className}`}>
            <input
                id={id}
                name={name}
                type="number"
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                placeholder={placeholder}
                required={required}
                className={`number-input-field pr-11 ${inputClassName}`}
            />
            <div
                className={`absolute right-2 top-1.5 bottom-1.5 flex w-9 flex-col overflow-hidden rounded-lg border border-[#c2c9bb] bg-white shadow-sm ${stepperVisibility} ${disabled ? "hidden" : ""}`}
            >
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => bump("up")}
                    className="flex flex-1 min-h-0 items-center justify-center text-[#42493e] transition-colors hover:bg-emerald-50 hover:text-[#154212] active:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase value"
                >
                    <ChevronUp size={16} strokeWidth={2.25} />
                </button>
                <div className="h-px shrink-0 bg-[#c2c9bb]" />
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => bump("down")}
                    className="flex flex-1 min-h-0 items-center justify-center text-[#42493e] transition-colors hover:bg-emerald-50 hover:text-[#154212] active:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease value"
                >
                    <ChevronDown size={16} strokeWidth={2.25} />
                </button>
            </div>
        </div>
    );
}
