import { ChevronDown, ChevronUp } from "lucide-react";

function clampWholeValue(value, min, max) {
    let next = value;
    if (min != null) {
        const wholeMin = Math.ceil(Number(min));
        if (next < wholeMin) next = wholeMin;
    }
    if (max != null) {
        const wholeMax = Math.floor(Number(max));
        if (next > wholeMax) next = wholeMax;
    }
    return next;
}

function capTypedValue(value, max) {
    if (value === "" || max == null) return value;

    const numericValue = Number(value);
    const numericMax = Number(max);

    if (!Number.isNaN(numericMax) && numericValue > numericMax) {
        return String(numericMax);
    }

    return value;
}

function sanitizeTypedValue(value, min) {
    const allowsNegative = min == null || Number(min) < 0;
    let hasDecimal = false;

    return value
        .split("")
        .filter((char, index) => {
            if (/\d/.test(char)) return true;
            if (char === "." && !hasDecimal) {
                hasDecimal = true;
                return true;
            }
            if (char === "-" && allowsNegative && index === 0) return true;
            return false;
        })
        .join("");
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
    const handleChange = (e) => {
        const numericText = sanitizeTypedValue(e.target.value, min);
        onChange?.(capTypedValue(numericText, max));
    };

    const handleKeyDown = (e) => {
        if (["e", "E", "+"].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === "-" && min != null && Number(min) >= 0) {
            e.preventDefault();
        }
    };

    const bump = (direction) => {
        if (disabled) return;

        const current = value === "" || value == null ? 0 : Number(value);
        if (Number.isNaN(current)) return;

        let next =
            direction === "up" ? Math.floor(current) + 1 : Math.ceil(current) - 1;
        next = clampWholeValue(next, min, max);

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
                onChange={handleChange}
                onKeyDown={handleKeyDown}
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
