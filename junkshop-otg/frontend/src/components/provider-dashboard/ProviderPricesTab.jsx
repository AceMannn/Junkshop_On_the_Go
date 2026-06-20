import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { domainApi } from "../../services/api";
import { useProviderMaterials } from "../../hooks/useProviderData";
import NumberInput from "../ui/NumberInput";

export default function ProviderPricesTab({ onNotify }) {
    const { materials, loading, refresh } = useProviderMaterials();
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [draftPrice, setDraftPrice] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return materials.filter(
            (item) =>
                !q ||
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
        );
    }, [materials, search]);

    const startEdit = (item) => {
        setEditingId(item.id);
        setDraftPrice(String(item.price));
    };

    const savePrice = async (id) => {
        const price = Number(draftPrice);
        if (!price || price < 0) {
            onNotify?.("Enter a valid price.");
            return;
        }
        try {
            await domainApi.updateMaterial(id, { price });
            setEditingId(null);
            refresh();
            onNotify?.("Price updated.");
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Prices
                </h1>
                <p className="text-[#72796e] mt-2 text-sm">
                    Update buy rates for your materials. Synced with your materials list.
                </p>
            </div>

            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 max-w-md">
                <Search size={18} className="text-[#72796e] mr-2 shrink-0" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search prices..."
                    className="w-full bg-transparent text-sm outline-none"
                />
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e]">Loading prices...</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 text-[#72796e]">
                    Add materials first to manage prices.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="md:hidden divide-y divide-zinc-100">
                        {filtered.map((item) => (
                            <div key={item.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#191c1c]">{item.name}</p>
                                        <p className="text-xs capitalize text-[#72796e]">{item.category}</p>
                                    </div>
                                    {editingId !== item.id && (
                                        <button
                                            type="button"
                                            onClick={() => startEdit(item)}
                                            className="text-xs font-semibold text-[#154212] hover:underline shrink-0"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {editingId === item.id ? (
                                    <div className="space-y-2">
                                        <NumberInput
                                            min={0}
                                            step={0.01}
                                            value={draftPrice}
                                            onChange={setDraftPrice}
                                            className="w-full max-w-[10rem]"
                                            inputClassName="w-full border border-zinc-200 rounded-lg pl-2 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-[#154212]/20"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => savePrice(item._id)}
                                                className="text-xs font-semibold text-emerald-800 hover:underline"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="text-xs font-semibold text-[#72796e] hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-semibold text-emerald-800">
                                        ₱{item.price}/{item.unit}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f3f4f3] text-[#42493e]">
                                <tr>
                                    <th className="text-left p-3 sm:p-4">Material</th>
                                    <th className="text-left p-3 sm:p-4">Category</th>
                                    <th className="text-left p-3 sm:p-4">Price</th>
                                    <th className="text-right p-3 sm:p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-50">
                                        <td className="p-3 sm:p-4 font-medium">{item.name}</td>
                                        <td className="p-3 sm:p-4 capitalize text-[#72796e]">
                                            {item.category}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            {editingId === item.id ? (
                                                <NumberInput
                                                    min={0}
                                                    step={0.01}
                                                    value={draftPrice}
                                                    onChange={setDraftPrice}
                                                    className="w-28"
                                                    inputClassName="w-full border border-zinc-200 rounded-lg pl-2 pr-9 py-1 text-sm outline-none focus:ring-2 focus:ring-[#154212]/20"
                                                />
                                            ) : (
                                                <span className="font-semibold text-emerald-800">
                                                    ₱{item.price}/{item.unit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 sm:p-4 text-right">
                                            {editingId === item.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => savePrice(item._id)}
                                                        className="text-xs font-semibold text-emerald-800 hover:underline"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingId(null)}
                                                        className="text-xs font-semibold text-[#72796e] hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(item)}
                                                    className="text-xs font-semibold text-[#154212] hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
