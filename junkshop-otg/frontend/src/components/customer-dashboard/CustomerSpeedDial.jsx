import { useEffect, useRef } from "react";
import { Plus, ReceiptText, Truck, BookmarkPlus, Camera } from "lucide-react";

const ACTIONS = [
    {
        id: "log-trip",
        label: "Log trip",
        icon: ReceiptText,
        hint: "Record a recycling visit",
    },
    {
        id: "request-pickup",
        label: "Request pickup",
        icon: Truck,
        hint: "Schedule junkshop pickup",
    },
    {
        id: "quick-add",
        label: "Quick add",
        icon: BookmarkPlus,
        hint: "Favorite, note, or transaction",
    },
    {
        id: "scan-photo",
        label: "Scan / photo",
        icon: Camera,
        hint: "Photo of your materials",
    },
];

export default function CustomerSpeedDial({ open, onToggle, onClose, onSelect }) {
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, onClose]);

    const handlePick = (id) => {
        onSelect(id);
        onClose();
    };

    return (
        <div
            ref={rootRef}
            className="fixed bottom-24 right-4 sm:right-6 md:bottom-8 md:right-8 z-30 flex flex-col items-end pointer-events-none"
        >
            {open && (
                <div
                    className="fixed inset-0 bg-black/20 z-[-1] md:hidden pointer-events-auto"
                    aria-hidden="true"
                    onClick={onClose}
                />
            )}

            <ul
                className={`flex flex-col-reverse items-end gap-3 mb-3 transition-all duration-200 pointer-events-none ${open ? "opacity-100" : "opacity-0"}`}
                aria-hidden={!open}
            >
                {ACTIONS.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <li
                            key={action.id}
                            className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 ${open
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-3"
                                }`}
                            style={{
                                transitionDelay: open ? `${index * 40}ms` : "0ms",
                            }}
                        >
                            <span className="hidden sm:block text-xs font-semibold text-[#191c1c] bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg shadow-sm max-w-[10rem] truncate">
                                {action.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => handlePick(action.id)}
                                className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-zinc-200 text-[#154212] shadow-md flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                                title={action.hint}
                                aria-label={action.label}
                            >
                                <Icon size={20} />
                            </button>
                        </li>
                    );
                })}
            </ul>

            <button
                type="button"
                onClick={onToggle}
                className={`pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 bg-[#154212] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-900 active:scale-95 transition-all duration-300 ${open ? "rotate-180" : "rotate-0"}`}
                aria-expanded={open}
                aria-label={open ? "Close quick actions" : "Open quick actions"}
            >
                <Plus size={24} />
            </button>
        </div>
    );
}
