import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Clock3,
    History,
    Layers,
    LayoutGrid,
    Loader2,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Table2,
    Trash2,
    X,
    Eye,
    EyeOff,
} from "lucide-react";
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

function getMaterialId(item) {
    return item?._id || item?.id;
}

function daysLeftMeta(days) {
    if (days <= 3) {
        return {
            text: `${days} day${days === 1 ? "" : "s"} left`,
            chip: "bg-red-50 text-red-700 border-red-200",
            bar: "bg-red-500",
        };
    }
    if (days <= 7) {
        return {
            text: `${days} days left`,
            chip: "bg-amber-50 text-amber-700 border-amber-200",
            bar: "bg-amber-500",
        };
    }
    return {
        text: `${days} days left`,
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
    };
}

function historyLabel(row) {
    return row?.label || String(row?.action || "Updated").replace(/_/g, " ");
}

export default function ProviderMaterialsTab({ onNotify, onRefreshProfile }) {
    const { materials, loading, refresh } = useProviderMaterials({ autoRefresh: true });
    const deleteTimerRef = useRef(null);
    const [activeTab, setActiveTab] = useState("active");
    const [deletedMaterials, setDeletedMaterials] = useState([]);
    const [trashLoading, setTrashLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("cards");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [historyMaterial, setHistoryMaterial] = useState(null);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [form, setForm] = useState({
        category: "plastic",
        name: getDefaultSubcategory("plastic"),
        customName: "",
        price: "",
        unit: "kg",
        available: true,
    });

    const activeCount = materials.length;
    const trashCount = deletedMaterials.length;

    const currentMaterials = activeTab === "trash" ? deletedMaterials : materials;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return currentMaterials.filter((item) => {
            const matchesCategory =
                categoryFilter === "all" ||
                item.category.toLowerCase() === categoryFilter.toLowerCase();
            const matchesSearch =
                !q ||
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [currentMaterials, search, categoryFilter]);

    const loadTrash = async ({ silent = false } = {}) => {
        if (!silent) setTrashLoading(true);
        try {
            const data = await domainApi.getDeletedMaterials();
            setDeletedMaterials(data.materials || []);
            if (data.purgedCount > 0) {
                onNotify?.(`${data.purgedCount} expired material${data.purgedCount === 1 ? "" : "s"} permanently deleted.`);
            }
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            if (!silent) setTrashLoading(false);
        }
    };

    useEffect(() => {
        loadTrash({ silent: true });
        return () => {
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab === "trash") {
            loadTrash();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

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

    const commitDelete = async (item) => {
        try {
            await domainApi.deleteMaterial(getMaterialId(item));
            onNotify?.("Material moved to trash. You can restore it within 30 days.");
            refresh();
            loadTrash({ silent: true });
            await onRefreshProfile?.();
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setPendingDelete(null);
            deleteTimerRef.current = null;
        }
    };

    const handleDelete = (item) => {
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        setPendingDelete(item);
        deleteTimerRef.current = setTimeout(() => {
            commitDelete(item);
        }, 5000);
    };

    const undoDelete = () => {
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
        setPendingDelete(null);
    };

    const restoreMaterial = async (item) => {
        try {
            await domainApi.restoreMaterial(getMaterialId(item));
            onNotify?.("Material restored as hidden. Turn it on when ready.");
            await loadTrash();
            refresh();
            await onRefreshProfile?.();
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    const openHistory = async (item) => {
        setHistoryMaterial(item);
        setHistoryItems([]);
        setHistoryLoading(true);
        try {
            const data = await domainApi.getMaterialHistory(getMaterialId(item));
            setHistoryMaterial(data.material || item);
            setHistoryItems(data.history || []);
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setHistoryLoading(false);
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
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                        type="button"
                        onClick={() => setActiveTab("active")}
                        className={`inline-flex h-10 items-center justify-center rounded-xl border px-5 text-sm font-semibold shadow-sm transition-colors ${
                            activeTab === "active"
                                ? "border-[#154212] bg-[#154212] text-white hover:bg-emerald-900"
                                : "border-emerald-200 bg-white text-[#154212] hover:bg-emerald-50"
                        }`}
                    >
                        Active ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("trash")}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold shadow-sm transition-colors ${
                            activeTab === "trash"
                                ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                                : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                        }`}
                    >
                        <Trash2 size={15} />
                        Trash ({trashCount})
                    </button>
                    <button
                        type="button"
                        onClick={openAdd}
                        disabled={activeTab === "trash"}
                        className={`inline-flex h-10 items-center justify-center gap-2 px-5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${
                            activeTab === "trash"
                                ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                                : "bg-[#154212] text-white hover:bg-emerald-900"
                        }`}
                        title={activeTab === "trash" ? "Switch to Active to add materials" : "Add material"}
                    >
                        <Plus size={18} />
                        Add Material
                    </button>
                </div>
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
                        disabled={activeTab === "trash"}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                            activeTab === "trash"
                                ? "cursor-not-allowed text-zinc-400"
                                : viewMode === "cards"
                                ? "bg-[#154212] text-white"
                                : "text-[#42493e] hover:bg-emerald-50"
                        }`}
                        aria-pressed={viewMode === "cards"}
                        title={activeTab === "trash" ? "Table view is disabled in trash" : "Show cards"}
                    >
                        <LayoutGrid size={14} />
                        Cards
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        disabled={activeTab === "trash"}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                            activeTab === "trash"
                                ? "cursor-not-allowed text-zinc-400"
                                : viewMode === "table"
                                ? "bg-[#154212] text-white"
                                : "text-[#42493e] hover:bg-emerald-50"
                        }`}
                        aria-pressed={viewMode === "table"}
                        title={activeTab === "trash" ? "Table view is disabled in trash" : "Show table"}
                    >
                        <Table2 size={14} />
                        Table
                    </button>
                </div>
            </div>

            {(activeTab === "trash" ? trashLoading : loading) ? (
                <p className="inline-flex items-center gap-2 text-sm text-[#72796e]">
                    <Loader2 size={16} className="animate-spin" />
                    Loading {activeTab === "trash" ? "trash" : "materials"}...
                </p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
                        <Layers size={26} className="text-zinc-400" />
                    </div>
                    <p className="text-[#191c1c] font-semibold">
                        {activeTab === "trash" ? "No deleted materials" : "No materials found"}
                    </p>
                    <p className="text-sm text-[#72796e]">
                        {activeTab === "trash"
                            ? "Items moved to trash appear here for 30 days before permanent deletion."
                            : "Add your first listing to start accepting pickups."}
                    </p>
                </div>
            ) : activeTab === "active" && viewMode === "table" ? (
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
                                    <tr key={getMaterialId(item)} className="hover:bg-zinc-50">
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
                                                    onClick={() => openHistory(item)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-zinc-300 text-[#42493e] px-3 py-1.5 rounded-lg"
                                                >
                                                    <History size={13} />
                                                    History
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg"
                                                >
                                                    <Trash2 size={13} />
                                                    Trash
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
                        const isTrash = activeTab === "trash";
                        const daysLeft = item.daysUntilPermanentDelete ?? 30;
                        const expiry = daysLeftMeta(daysLeft);
                        const progressWidth = `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%`;
                        return (
                            <article
                                key={getMaterialId(item)}
                                className={`bg-white rounded-xl border border-zinc-200 border-t-2 ${cat.border} p-4 sm:p-5 shadow-sm ${
                                    isTrash ? "opacity-90 bg-zinc-50/80" : ""
                                }`}
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
                                            {isTrash && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${expiry.chip}`}>
                                                    <Clock3 size={11} />
                                                    {expiry.text}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={`font-bold text-[#191c1c] mt-1 ${isTrash ? "line-through decoration-red-300" : ""}`}>
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-[#72796e] mt-0.5">
                                            {isTrash
                                                ? `Moved to trash ${formatUpdatedDate(item.deletedAt)}`
                                                : `Posted ${formatUpdatedDate(item.createdAt || item.updatedAt)}`}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xl font-bold text-emerald-700">₱{item.price}</p>
                                        <p className="text-xs text-[#72796e]">per {item.unit}</p>
                                    </div>
                                </div>
                                {isTrash && (
                                    <div className="mt-4">
                                        <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${expiry.bar}`}
                                                style={{ width: progressWidth }}
                                            />
                                        </div>
                                        <p className="mt-2 flex items-center gap-1 text-xs text-[#72796e]">
                                            <AlertTriangle size={13} />
                                            Permanently deletes after 30 days in trash.
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100">
                                    {!isTrash && (
                                        <>
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
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => openHistory(item)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-zinc-300 text-[#42493e] px-3 py-1.5 rounded-lg"
                                    >
                                        <History size={13} />
                                        History
                                    </button>
                                    {isTrash ? (
                                        <button
                                            type="button"
                                            onClick={() => restoreMaterial(item)}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#154212] text-white px-3 py-1.5 rounded-lg ml-auto"
                                        >
                                            <RotateCcw size={13} />
                                            Restore hidden
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg ml-auto"
                                        >
                                            <Trash2 size={13} />
                                            Trash
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {pendingDelete && (
                <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <Trash2 size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#191c1c]">Move material to trash?</p>
                            <p className="text-sm text-[#72796e]">
                                {pendingDelete.name} will stay recoverable for 30 days.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={undoDelete}
                            className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#154212] hover:bg-emerald-50"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}

            {historyMaterial && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setHistoryMaterial(null)}>
                    <aside
                        className="scroll-y-clean h-full w-full max-w-md bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-[#72796e]">
                                        Material history
                                    </p>
                                    <h2 className="mt-1 text-xl font-bold text-[#191c1c]">
                                        {historyMaterial.name}
                                    </h2>
                                    <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold uppercase text-zinc-600">
                                        {formatMaterialCategoryLabel(historyMaterial.category)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHistoryMaterial(null)}
                                    className="rounded-xl border border-zinc-200 p-2 text-[#42493e] hover:bg-zinc-50"
                                    aria-label="Close history"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            {historyLoading ? (
                                <p className="inline-flex items-center gap-2 text-sm text-[#72796e]">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading history...
                                </p>
                            ) : historyItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
                                    <Clock3 className="mx-auto mb-3 text-zinc-400" />
                                    <p className="font-semibold text-[#191c1c]">No history yet</p>
                                    <p className="mt-1 text-sm text-[#72796e]">
                                        Future material updates will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {historyItems.map((row, index) => (
                                        <div key={row._id || `${row.action}-${index}`} className="relative flex gap-3 pb-5">
                                            {index < historyItems.length - 1 && (
                                                <div className="absolute left-[0.57rem] top-5 h-full w-px bg-zinc-200" />
                                            )}
                                            <div className="relative z-10 mt-1 h-5 w-5 rounded-full border-4 border-white bg-[#154212] shadow" />
                                            <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                                <p className="font-semibold text-[#191c1c]">{historyLabel(row)}</p>
                                                <p className="mt-1 text-xs text-[#72796e]">
                                                    {formatUpdatedDate(row.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
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
