import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function Select({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    className = "",
    disabled = false,
    ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const selected = options.find((option) => option.value === value);

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-haspopup="listbox"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-[#42493e] outline-none transition-all ${
                    open
                        ? "border-emerald-500 ring-2 ring-emerald-200/80"
                        : "border-[#c2c9bb] hover:border-emerald-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
            >
                <span className="truncate capitalize">
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-[#72796e] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    aria-label={ariaLabel}
                    className="scrollbar-clean absolute z-[60] mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-[#c2c9bb] bg-white py-1 shadow-[0_8px_24px_rgba(20,66,18,0.12)]"
                >
                    {options.map((option) => {
                        const active = option.value === value;

                        return (
                            <li key={option.value} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm capitalize transition-colors ${
                                        active
                                            ? "bg-emerald-50 font-semibold text-[#154212]"
                                            : "text-[#42493e] hover:bg-emerald-50/70"
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {active && (
                                        <Check size={14} className="shrink-0 text-emerald-700" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
