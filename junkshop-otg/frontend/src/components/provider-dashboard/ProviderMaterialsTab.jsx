import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { domainApi } from "../../services/api";
import { useProviderMaterials } from "../../hooks/useProviderData";
import NumberInput from "../ui/NumberInput";
import Select from "../ui/Select";

const CATEGORIES = ["plastic", "metal", "paper", "glass", "e-waste", "other"];

const FILTER_OPTIONS = [
    { value: "all", label: "All categories" },
    ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
];

const CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({ value: cat, label: cat }));

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
        if (!form.name.trim() || !form.price) {
            onNotify?.("Name and price are required.");
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
        <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-8">
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

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 flex-1 max-w-md">
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
                    className="min-w-[160px] sm:min-w-[180px]"
                />
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e]">Loading materials...</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 text-[#72796e]">
                    No materials yet. Add your first listing.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((item) => (
                        <article
                            key={item.id}
                            className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-sm"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <h3 className="font-bold text-[#191c1c]">{item.name}</h3>
                                    <p className="text-xs text-[#72796e] capitalize mt-0.5">
                                        {item.category}
                                    </p>
                                </div>
                                <span
                                    className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${item.available
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-zinc-200 text-zinc-600"
                                        }`}
                                >
                                    {item.available ? "Available" : "Hidden"}
                                </span>
                            </div>
                            <p className="text-lg font-bold text-emerald-800 mt-3">
                                ₱{item.price}
                                <span className="text-sm font-medium text-[#72796e]">/{item.unit}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => openEdit(item)}
                                    className="text-sm font-semibold text-[#154212] hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleAvailability(item)}
                                    className="text-sm font-semibold text-[#72796e] hover:underline"
                                >
                                    {item.available ? "Hide" : "Show"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(item._id)}
                                    className="text-sm font-semibold text-red-600 hover:underline inline-flex items-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-md p-6 space-y-4"
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
                        <NumberInput
                            min={0}
                            step={0.01}
                            value={form.price}
                            onChange={(v) => setForm({ ...form, price: v })}
                            placeholder="Price per kg"
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
