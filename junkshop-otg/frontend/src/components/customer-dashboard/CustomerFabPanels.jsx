import { useState } from "react";
import { Heart, StickyNote, ReceiptText, Camera } from "lucide-react";

const QUICK_MODES = [
    { id: "favorite", label: "Favorite shop", icon: Heart },
    { id: "note", label: "Note", icon: StickyNote },
    { id: "transaction", label: "Transaction", icon: ReceiptText },
];

export function QuickAddPanel({
    shops = [],
    favoriteIds = [],
    onToggleFavorite,
    onSubmit,
}) {
    const [mode, setMode] = useState("favorite");
    const [shopId, setShopId] = useState(shops[0]?.id || "");
    const [note, setNote] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (mode === "favorite" && !shopId) {
            setError("Select a junkshop to favorite.");
            return;
        }
        if (mode === "note" && !note.trim()) {
            setError("Write a short note.");
            return;
        }
        if (mode === "transaction" && !amount.trim()) {
            setError("Enter an amount or short description.");
            return;
        }

        const shop = shops.find((s) => s.id === shopId);
        if (mode === "favorite" && shopId && onToggleFavorite) {
            if (!favoriteIds.includes(String(shopId))) {
                onToggleFavorite(shopId);
            }
        }
        onSubmit?.({ mode, shopId, shopName: shop?.name, note: note.trim(), amount: amount.trim() });
    };

    return (
        <div className="space-y-6 max-w-xl">
            <p className="text-sm text-[#72796e]">
                Quickly save a favorite junkshop, a reminder note, or a transaction memo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {QUICK_MODES.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setMode(id)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-colors ${mode === id
                            ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                            : "bg-white border-zinc-200 text-[#72796e] hover:border-emerald-200"
                            }`}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "favorite" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#42493e]">
                            Junkshop
                        </label>
                        <select
                            value={shopId}
                            onChange={(e) => setShopId(e.target.value)}
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        >
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === "note" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#42493e]">Note</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            placeholder="Reminders before your next trip..."
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212] resize-none"
                        />
                    </div>
                )}

                {mode === "transaction" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#42493e]">
                            Quick transaction memo
                        </label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. ₱45 — aluminum cans at Green Recyclers"
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        />
                        <p className="text-xs text-[#72796e]">
                            For full details, use <strong>Log trip</strong> instead.
                        </p>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="bg-[#154212] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors"
                >
                    Save
                </button>
            </form>
        </div>
    );
}

export function ScanPhotoPanel({ onSubmit }) {
    const [preview, setPreview] = useState(null);
    const [fileName, setFileName] = useState("");

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!preview) return;
        onSubmit?.({ fileName, imageData: preview });
    };

    return (
        <div className="space-y-6 max-w-xl">
            <p className="text-sm text-[#72796e]">
                Upload a photo of your recyclables. Material detection and price estimates will
                connect here in a future update.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/40 p-8 cursor-pointer hover:bg-emerald-50/70 transition-colors">
                    <Camera className="w-10 h-10 text-emerald-700" />
                    <span className="text-sm font-semibold text-[#154212]">
                        Tap to upload or take a photo
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={handleFile}
                    />
                </label>

                {preview && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 max-h-64">
                        <img src={preview} alt="Material preview" className="w-full h-full object-cover" />
                    </div>
                )}

                {fileName && (
                    <p className="text-xs text-[#72796e]">
                        Selected: <span className="font-medium">{fileName}</span>
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!preview}
                    className="bg-[#154212] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save photo
                </button>
            </form>
        </div>
    );
}
