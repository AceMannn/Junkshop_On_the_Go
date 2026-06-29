import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye, EyeOff, Layers, LayoutGrid, Table2 } from "lucide-react";
import { domainApi } from "../../services/api";
import { useProviderMaterials } from "../../hooks/useProviderData";
import NumberInput from "../ui/NumberInput";
import Select from "../ui/Select";
import { formatMaterialCategoryLabel, formatUpdatedDate } from "../../utils/catalogMappers";

const CATEGORIES = ["plastic", "paper", "metal", "glass", "e-waste", "tires"];

const CATEGORY_COLORS = {
    plastic:   { chip: "bg-blue-100 text-blue-700",    border: "border-t-blue-400"   },
    metal:     { chip: "bg-amber-100 text-amber-700",   border: "border-t-amber-400"  },
    paper:     { chip: "bg-emerald-100 text-emerald-700", border: "border-t-emerald-400" },
    glass:     { chip: "bg-teal-100 text-teal-700",    border: "border-t-teal-400"   },
    "e-waste": { chip: "bg-purple-100 text-purple-700", border: "border-t-purple-400" },
    tires:     { chip: "bg-zinc-200 text-zinc-800",     border: "border-t-zinc-500"   },
    other:     { chip: "bg-zinc-100 text-zinc-600",    border: "border-t-zinc-300"   },
};

const FILTER_OPTIONS = [
    { value: "all", label: "All categories" },
    ...CATEGORIES.map((cat) => ({ value: cat, label: formatMaterialCategoryLabel(cat) })),
];

const CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({ value: cat, label: formatMaterialCategoryLabel(cat) }));
const UNIT_OPTIONS = [
    { value: "kg", label: "Per kg" },
    { value: "piece", label: "Per piece" },
];
const CUSTOM_SUBCATEGORY_VALUE = "__custom__";

const SUBCATEGORY_OPTIONS_BY_CATEGORY = {
    plastic: [
        "PET Bottles (Clear)",
        "PET Bottles (Colored)",
        "Hard Plastic",
        "Plastic Bags (Soft)",
        "Plastic Chairs",
        "Plastic Containers",
    ],
    paper: [
        "White Paper",
        "Newspaper",
        "Mixed Paper",
        "Cardboard",
        "Magazines",
        "Paper Bags",
    ],
    metal: [
        "Scrap Metal (Iron)",
        "Metal Bars",
        "Aluminum Cans",
        "Copper Wire",
        "Brass",
        "Steel Cans",
    ],
    glass: [
        "Glass Bottles (Clear)",
        "Glass Bottles (Colored)",
        "Glass Jars",
    ],
    "e-waste": [
        "Electric Fan",
        "Computer Parts",
        "Mobile Phones",
        "Cables & Wires",
        "Batteries",
        "Chargers",
    ],
    tires: [
        "Used Tires",
        "Car Tires",
        "Motorcycle Tires",
        "Bicycle Tires",
    ],
};

function getSubcategoryOptions(category) {
    const rows = SUBCATEGORY_OPTIONS_BY_CATEGORY[category] || [];
    return [
        ...rows.map((name) => ({ value: name, label: name })),
        { value: CUSTOM_SUBCATEGORY_VALUE, label: "Other / custom" },
    ];
}

function getDefaultSubcategory(category) {
    return SUBCATEGORY_OPTIONS_BY_CATEGORY[category]?.[0] || "";
}

function isKnownSubcategory(category, name) {
    return (SUBCATEGORY_OPTIONS_BY_CATEGORY[category] || []).some(
        (item) => item.toLowerCase() === String(name || "").trim().toLowerCase()
    );
}

export default function ProviderMaterialsTab({ onNotify, onRefreshProfile }) {
    const { materials, loading, refresh } = useProviderMaterials({ autoRefresh: true });
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("cards");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        category: "plastic",
        name: getDefaultSubcategory("plastic"),
        customName: "",
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
        setForm({
            category: "plastic",
            name: getDefaultSubcategory("plastic"),
            customName: "",
            price: "",
            unit: "kg",
            available: true,
        });
        setModalOpen(true);
    };

    const openEdit = (item) => {
        const known = isKnownSubcategory(item.category, item.name);
        setEditing(item);
        setForm({
            category: item.category,
            name: known ? item.name : CUSTOM_SUBCATEGORY_VALUE,
            customName: known ? "" : item.name,
            price: String(item.price),
            unit: item.unit,
            available: item.available,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const materialName =
            form.name === CUSTOM_SUBCATEGORY_VALUE ? form.customName.trim() : form.name.trim();

        if (!materialName || !form.price || Number(form.price) <= 0) {
            onNotify?.("Subcategory and a price greater than ₱0 are required.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: materialName,
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
                <div className="flex min-w-0 h-10 flex-1 items-center bg-white border border-zinc-200 rounded-xl px-4">
                    <Search size={16} className="text-[#72796e] mr-2 shrink-0" />
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
                <div className="inline-flex h-10 rounded-xl border border-zinc-200 bg-white p-0.5 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setViewMode("cards")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                            viewMode === "cards"
                                ? "bg-[#154212] text-white"
                                : "text-[#42493e] hover:bg-emerald-50"
                        }`}
                        aria-pressed={viewMode === "cards"}
                    >
                        <LayoutGrid size={14} />
                        Cards
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                            viewMode === "table"
                                ? "bg-[#154212] text-white"
                                : "text-[#42493e] hover:bg-emerald-50"
                        }`}
                        aria-pressed={viewMode === "table"}
                    >
                        <Table2 size={14} />
                        Table
                    </button>
                </div>
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
            ) : viewMode === "table" ? (
                <div className="scroll-x-clean overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-[#f3f4f3] text-[#42493e]">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Material</th>
                                <th className="px-4 py-3 text-left font-semibold">Category</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-left font-semibold">Price</th>
                                <th className="px-4 py-3 text-left font-semibold">Posted</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered.map((item) => {
                                const catKey = item.category?.toLowerCase() || "other";
                                const cat = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;

                                return (
                                    <tr key={item.id} className="hover:bg-zinc-50">
                                        <td className="px-4 py-4">
                                            <p className="font-bold text-[#191c1c]">{item.name}</p>
                                            <p className="text-xs text-[#72796e]">per {item.unit}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${cat.chip}`}>
                                                {formatMaterialCategoryLabel(item.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${item.available
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-zinc-200 text-zinc-500"
                                                }`}
                                            >
                                                {item.available ? "Available" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-bold text-emerald-700">
                                            ₱{item.price}
                                        </td>
                                        <td className="px-4 py-4 text-[#72796e]">
                                            {formatUpdatedDate(item.createdAt || item.updatedAt)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
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
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg"
                                                >
                                                    <Trash2 size={13} />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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
                                                {formatMaterialCategoryLabel(item.category)}
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
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#42493e]">
                                Category
                            </label>
                            <Select
                                value={form.category}
                                onChange={(category) =>
                                    setForm({
                                        ...form,
                                        category,
                                        name: getDefaultSubcategory(category),
                                        customName: "",
                                        unit: category === "tires" ? "piece" : form.unit,
                                    })
                                }
                                options={CATEGORY_OPTIONS}
                                ariaLabel="Material category"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#42493e]">
                                Subcategory
                            </label>
                            <Select
                                value={form.name}
                                onChange={(name) => setForm({ ...form, name })}
                                options={getSubcategoryOptions(form.category)}
                                ariaLabel="Material subcategory"
                            />
                        </div>
                        {form.name === CUSTOM_SUBCATEGORY_VALUE && (
                            <input
                                value={form.customName}
                                onChange={(e) => setForm({ ...form, customName: e.target.value })}
                                placeholder={`Custom ${formatMaterialCategoryLabel(form.category)} subcategory`}
                                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm"
                                required
                            />
                        )}
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
                            max={20000}
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
