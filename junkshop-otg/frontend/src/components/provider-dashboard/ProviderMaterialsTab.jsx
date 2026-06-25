import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye, EyeOff, Layers } from "lucide-react";
import { domainApi } from "../../services/api";
import { useProviderMaterials } from "../../hooks/useProviderData";
import NumberInput from "../ui/NumberInput";
import Select from "../ui/Select";
import { formatUpdatedDate } from "../../utils/catalogMappers";

const CATEGORIES = ["plastic", "metal", "paper", "glass", "e-waste", "other"];

const CATEGORY_COLORS = {
    plastic:   { chip: "bg-blue-100 text-blue-700",    border: "border-t-blue-400"   },
    metal:     { chip: "bg-amber-100 text-amber-700",   border: "border-t-amber-400"  },
    paper:     { chip: "bg-emerald-100 text-emerald-700", border: "border-t-emerald-400" },
    glass:     { chip: "bg-teal-100 text-teal-700",    border: "border-t-teal-400"   },
    "e-waste": { chip: "bg-purple-100 text-purple-700", border: "border-t-purple-400" },
    other:     { chip: "bg-zinc-100 text-zinc-600",    border: "border-t-zinc-300"   },
};

const FILTER_OPTIONS = [
    { value: "all", label: "All categories" },
    ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
];

const CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({ value: cat, label: cat }));
const UNIT_OPTIONS = [
    { value: "kg", label: "Per kg" },
    { value: "piece", label: "Per piece" },
];

export default function ProviderMaterialsTab({ onNotify, onRefreshProfile }) {
    const { materials, loading, refresh } = useProviderMaterials({ autoRefresh: true });
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        category: "plastic",
        price: "",
        unit: "kg",
        available: true,
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return materials.filter((item) => {
            const matchesCategory =
                categoryFilter === "all" ||
                item.category.toLowerCase() === categoryFilter.toLowerCase();
            const matchesSearch =
                !q ||
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [materials, search, categoryFilter]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: "", category: "plastic", price: "", unit: "kg", available: true });
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.name,
            category: item.category,
            price: String(item.price),
            unit: item.unit,
            available: item.available,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price || Number(form.price) <= 0) {
            onNotify?.("Name and a price greater than ₱0 are required.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                category: form.category,
                price: Number(form.price),
                unit: form.unit,
                available: form.available,
            };
            if (editing) {
                await domainApi.updateMaterial(editing._id, payload);
                onNotify?.("Material updated.");
            } else {
                await domainApi.createMaterial(payload);
                onNotify?.("Material added.");
            }
            setModalOpen(false);
            refresh();
            await onRefreshProfile?.();
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this material?")) return;
        try {
            await domainApi.deleteMaterial(id);
            onNotify?.("Material deleted.");
            refresh();
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    const toggleAvailability = async (item) => {
        try {
            await domainApi.updateMaterial(item._id, { available: !item.available });
            refresh();
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                        Materials
                    </h1>
                    <p className="text-[#72796e] mt-2 text-sm">
                        Manage what your shop accepts. Shown to customers in your catalog.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center justify-center gap-2 bg-[#154212] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors"
                >
                    <Plus size={18} />
                    Add Material
                </button>
            </div>

            <div className="flex min-w-0 flex-col sm:flex-row gap-3">
                <div className="flex min-w-0 flex-1 items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5">
                    <Search size={18} className="text-[#72796e] mr-2 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search materials..."
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>
                <Select
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={FILTER_OPTIONS}
                    ariaLabel="Filter by category"
                    className="w-full sm:w-auto sm:min-w-[10rem]"
                />
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e]">Loading materials...</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
                        <Layers size={26} className="text-zinc-400" />
                    </div>
                    <p className="text-[#191c1c] font-semibold">No materials found</p>
                    <p className="text-sm text-[#72796e]">Add your first listing to start accepting pickups.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((item) => {
                        const catKey = item.category?.toLowerCase() || "other";
                        const cat = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;
                        return (
                            <article
                                key={item.id}
                                className={`bg-white rounded-xl border border-zinc-200 border-t-2 ${cat.border} p-4 sm:p-5 shadow-sm`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cat.chip}`}>
                                                {item.category || "Other"}
                                            </span>
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.available
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-zinc-200 text-zinc-500"
                                                }`}
                                            >
                                                {item.available ? "Available" : "Hidden"}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-[#191c1c] mt-1">{item.name}</h3>
                                        <p className="text-xs text-[#72796e] mt-0.5">
                                            Posted {formatUpdatedDate(item.createdAt || item.updatedAt)}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xl font-bold text-emerald-700">₱{item.price}</p>
                                        <p className="text-xs text-[#72796e]">per {item.unit}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(item)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#154212] text-white px-3 py-1.5 rounded-lg"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleAvailability(item)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-zinc-300 text-[#42493e] px-3 py-1.5 rounded-lg"
                                    >
                                        {item.available ? <EyeOff size={13} /> : <Eye size={13} />}
                                        {item.available ? "Hide" : "Show"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item._id)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg ml-auto"
                                    >
                                        <Trash2 size={13} />
                                        Delete
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
                    <form
                        onSubmit={handleSubmit}
                        className="scroll-y-clean bg-white rounded-t-2xl sm:rounded-2xl border border-zinc-200 shadow-xl w-full sm:max-w-md max-h-[92dvh] p-6 space-y-4"
                    >
                        <h2 className="text-lg font-bold text-[#191c1c]">
                            {editing ? "Edit material" : "Add material"}
                        </h2>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Material name"
                            className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm"
                            required
                        />
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#42493e]">
                                Category
                            </label>
                            <Select
                                value={form.category}
                                onChange={(category) => setForm({ ...form, category })}
                                options={CATEGORY_OPTIONS}
                                ariaLabel="Material category"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#42493e]">
                                Unit
                            </label>
                            <Select
                                value={form.unit}
                                onChange={(unit) => setForm({ ...form, unit })}
                                options={UNIT_OPTIONS}
                                ariaLabel="Material unit"
                            />
                        </div>
                        <NumberInput
                            min={0.01}
                            step={0.01}
                            value={form.price}
                            onChange={(v) => setForm({ ...form, price: v })}
                            placeholder={form.unit === "piece" ? "Price per piece" : "Price per kg"}
                            inputClassName="w-full border border-zinc-200 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#154212]/20"
                            required
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.available}
                                onChange={(e) =>
                                    setForm({ ...form, available: e.target.checked })
                                }
                            />
                            Available to customers
                        </label>
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-[#72796e]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-[#154212] text-white text-sm font-semibold disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
