import { HelpCircle, X } from "lucide-react";

const FAQ_ITEMS = [
    {
        q: "How do I book a pickup?",
        a: "Go to Pickups → Book pickup. Add your phone in Profile Settings first if prompted.",
    },
    {
        q: "When do shops appear on the map?",
        a: "Only verified partner shops show up — after a provider completes shop setup (address, materials, GCash, etc.).",
    },
    {
        q: "How do providers get listed?",
        a: "Sign up as a provider, then finish Settings: shop info, map pin, materials, prices, and GCash details.",
    },
    {
        q: "Are map routes accurate?",
        a: "Routes use free OpenStreetMap data. Tap the pin on the map to fine-tune your shop location for best results.",
    },
];

export default function HelpModal({ isOpen, onClose, onContact }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="help-modal-title"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="text-emerald-700" size={22} />
                        <h2 id="help-modal-title" className="text-lg font-bold text-[#191c1c]">
                            Help &amp; FAQ
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-100"
                        aria-label="Close help"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {FAQ_ITEMS.map((item) => (
                        <div
                            key={item.q}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3"
                        >
                            <p className="text-sm font-semibold text-[#191c1c]">{item.q}</p>
                            <p className="text-sm text-[#72796e] mt-1 leading-relaxed">{item.a}</p>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onContact?.();
                        }}
                        className="w-full rounded-xl bg-[#154212] text-white py-3 text-sm font-semibold hover:bg-emerald-900 transition-colors"
                    >
                        Still need help? Contact us
                    </button>
                </div>
            </div>
        </div>
    );
}
