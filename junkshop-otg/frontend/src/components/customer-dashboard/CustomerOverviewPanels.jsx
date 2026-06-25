import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    MapPin,
    Phone,
    Search,
    Map,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    XCircle,
    Leaf,
    AlertCircle,
    ReceiptText,
    RefreshCw,
} from "lucide-react";
import { Heart } from "lucide-react";
import JunkshopsMap from "../maps/JunkshopsMap";
import EmptyState from "../ui/EmptyState";
import ShopRating from "../ui/ShopRating";
import VerifiedPartnerIcon, { isVerified } from "../ui/VerifiedPartnerIcon";
import ShopCardPreviewDetails from "./ShopCardPreviewDetails";
import NumberInput from "../ui/NumberInput";
import { isFavoriteShopId } from "../../utils/favorites";
import { priceCategories } from "../../data/prices";
import { useCatalogJunkshops, useCatalogMaterials } from "../../hooks/useCatalogData";
import { domainApi } from "../../services/api";
import {
    formatUpdatedDate,
    getMaterialTrend,
    shopStatusBadgeClass,
} from "../../utils/catalogMappers";
import {
    recyclingSteps,
    recyclingDos,
    recyclingDonts,
    materialGuides,
} from "../../data/recyclingGuide";

const LOCATION_FILTERS = [
    { id: "all", label: "All areas" },
    { id: "teresa", label: "Teresa" },
    { id: "sta-mesa", label: "Sta. Mesa" },
];

const HIGHLIGHT_CATEGORIES = [
    "aluminum",
    "copper",
    "plastic",
    "cardboard",
    "paper",
    "glass",
    "steel",
];

function parsePriceMid(perKgPrice) {
    const match = perKgPrice.match(/₱(\d+)/);
    return match ? Number(match[1]) : 0;
}

function PanelStatus({ loading, error, source, onRetry }) {
    if (loading) {
        return (
            <p className="text-sm text-[#72796e] animate-pulse" role="status">
                Loading latest data…
            </p>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-red-800 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <p>{error}</p>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 font-semibold text-red-900 hover:underline shrink-0"
                    >
                        <RefreshCw size={14} />
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return null;
}

export function DashboardPanelShell({ title, onClose, children }) {
    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-20 flex flex-col bg-white md:left-56">
            <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4 border-b border-zinc-200 shrink-0 bg-white">
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 inline-flex items-center gap-1.5 sm:gap-2 text-sm font-semibold text-[#154212] hover:bg-emerald-50 px-2 sm:px-3 py-2 rounded-lg transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Back to Overview</span>
                    <span className="sm:hidden">Back</span>
                </button>
                <h2 className="flex-1 min-w-0 text-base sm:text-xl font-bold text-[#191c1c] truncate text-center sm:text-left">
                    {title}
                </h2>
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden">
                <div className="dashboard-panel-scroll h-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 lg:pb-6">
                    {children}
                </div>
                {/* Windows Chromium may still paint arrow buttons — cover the track ends */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 right-0 z-10 h-4 w-[17px] bg-white"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 right-0 z-10 h-4 w-[17px] bg-white"
                />
            </div>
        </div>
    );
}

export function JunkshopsPanel({
    favoriteIds = [],
    onToggleFavorite,
    initialShopId = null,
    autoRouteShopId = null,
    onRouteDrawn,
    onViewProfile,
}) {
    const { shops, loading, error, source, refresh } = useCatalogJunkshops({ partnersOnly: true });
    const [query, setQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(initialShopId);
    const [pendingRouteId, setPendingRouteId] = useState(null);
    const effectiveRouteId = autoRouteShopId || pendingRouteId;

    useEffect(() => {
        if (initialShopId) {
            setExpandedId(initialShopId);
        }
    }, [initialShopId]);

    const filteredShops = useMemo(() => {
        return shops.filter((shop) => {
            const matchesQuery =
                !query.trim() ||
                shop.name.toLowerCase().includes(query.toLowerCase()) ||
                shop.address.toLowerCase().includes(query.toLowerCase()) ||
                shop.materials.some((m) =>
                    m.toLowerCase().includes(query.toLowerCase())
                );

            const addressLower = shop.address.toLowerCase();
            const matchesLocation =
                locationFilter === "all" ||
                (locationFilter === "teresa" && addressLower.includes("teresa")) ||
                (locationFilter === "sta-mesa" && addressLower.includes("sta. mesa"));

            // Only show shops within 5 km (shops with no distanceKm are always shown)
            const withinRange =
                shop.distanceKm == null || shop.distanceKm <= 5;

            return matchesQuery && matchesLocation && withinRange;
        });
    }, [shops, query, locationFilter]);

    return (
        <div className="space-y-6">
            <PanelStatus loading={loading} error={error} source={source} onRetry={refresh} />
            <p className="text-sm text-[#72796e] max-w-2xl">
                Verified partner junkshops only — providers appear here after they complete shop setup.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-2.5">
                    <Search size={18} className="text-[#72796e] shrink-0 mr-2" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search junkshops or materials..."
                        className="w-full bg-transparent outline-none text-sm"
                    />
                </div>

                <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="sm:w-44 bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-2.5 text-sm font-medium text-[#42493e] outline-none focus:ring-2 focus:ring-[#154212]"
                    aria-label="Location filter"
                >
                    {LOCATION_FILTERS.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-6">
            <div className="order-1 space-y-4 lg:order-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#72796e]">
                    {filteredShops.length} shop{filteredShops.length !== 1 ? "s" : ""} found
                </p>

                {filteredShops.length === 0 ? (
                    <EmptyState
                        compact
                        title={shops.length === 0 ? "No partner shops yet" : "No junkshops within range"}
                        description={
                            shops.length === 0
                                ? "Verified junkshops appear here after providers complete shop setup (address, materials, GCash, and map pin)."
                                : "No junkshops found within 5 km of your location. Try a different filter."
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredShops.map((shop) => {
                            const isOpen = shop.status === "Open";
                            const isExpanded = expandedId === shop.id;

                            return (
                                <article
                                    key={shop.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                        setExpandedId(isExpanded ? null : shop.id)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setExpandedId(isExpanded ? null : shop.id);
                                        }
                                    }}
                                    className={`bg-[#f9f9f8] border rounded-xl p-4 sm:p-5 cursor-pointer transition-colors ${isExpanded
                                        ? "border-emerald-500 ring-2 ring-emerald-200"
                                        : "border-zinc-200 hover:border-emerald-300"
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <h3 className="font-bold text-[#191c1c] truncate">
                                                    {shop.name}
                                                </h3>
                                                {isVerified(shop) && (
                                                    <VerifiedPartnerIcon size="sm" />
                                                )}
                                            </div>
                                            <p className="text-xs text-[#72796e] flex items-start gap-1 mt-1">
                                                <MapPin size={14} className="shrink-0 mt-0.5" />
                                                <span>{shop.address}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {onToggleFavorite && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleFavorite(shop.id);
                                                    }}
                                                    className={`p-1.5 rounded-full ${isFavoriteShopId(shop.id, favoriteIds)
                                                        ? "text-red-600"
                                                        : "text-zinc-400 hover:text-red-500"
                                                        }`}
                                                    aria-label="Toggle favorite"
                                                >
                                                    <Heart
                                                        size={16}
                                                        fill={
                                                            isFavoriteShopId(shop.id, favoriteIds)
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />
                                                </button>
                                            )}
                                            <span
                                                className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${shopStatusBadgeClass(shop.status)}`}
                                            >
                                                {shop.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                                        <span className="font-semibold text-emerald-700">
                                            {shop.distance}
                                        </span>
                                        <span className="text-[#72796e]">•</span>
                                        <span className="text-[#72796e]">{shop.hours}</span>
                                        <span className="text-[#72796e]">•</span>
                                        <ShopRating shop={shop} />
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {shop.materials.length > 0 ? (
                                            shop.materials.map((material) => (
                                                <span
                                                    key={material}
                                                    className="bg-[#c9e7cc] text-[#4e6953] px-2 py-0.5 rounded-md text-[10px] font-medium"
                                                >
                                                    {material}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-[#72796e] italic">
                                                Materials not listed yet
                                            </span>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <ShopCardPreviewDetails shop={shop} />
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewProfile?.(shop);
                                            }}
                                            className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-[#154212] text-white rounded-lg text-sm font-bold hover:bg-emerald-900 transition-colors"
                                        >
                                            View Shop Profile
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedId(shop.id);
                                                setPendingRouteId(shop.id);
                                            }}
                                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-300 text-[#42493e] rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors"
                                        >
                                            <Map size={15} />
                                            Route
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {!loading && (
                <div className="order-2 lg:order-1">
                    <JunkshopsMap
                        shops={shops}
                        selectedId={expandedId}
                        onSelectShop={setExpandedId}
                        routingEnabled
                        autoRouteShopId={effectiveRouteId}
                        onRouteDrawn={() => {
                            setPendingRouteId(null);
                            onRouteDrawn?.();
                        }}
                        className="fluid-map-min-height w-full"
                    />
                </div>
            )}
            {loading && (
                <div className="order-2 lg:order-1 rounded-xl border border-emerald-200 bg-zinc-50 fluid-map-min-height flex items-center justify-center text-sm text-[#72796e]">
                    Loading map…
                </div>
            )}
            </div>
        </div>
    );
}

function TrendBadge({ trend }) {
    if (trend === "up") {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={14} />
                Rising
            </span>
        );
    }
    if (trend === "down") {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <TrendingDown size={14} />
                Softening
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
            <Minus size={14} />
            Stable
        </span>
    );
}

export function MaterialPricesPanel() {
    const { materials, loading, error, source, refresh } = useCatalogMaterials();
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredPrices = useMemo(() => {
        if (activeCategory === "all") return materials;
        return materials.filter((item) => item.category === activeCategory);
    }, [materials, activeCategory]);

    const highlightRows = useMemo(() => {
        const keywords = {
            aluminum: "aluminum",
            copper: "copper",
            plastic: "plastic",
            cardboard: "cardboard",
            paper: "paper",
            glass: "glass",
            steel: "scrap metal|steel|iron",
        };

        return HIGHLIGHT_CATEGORIES.map((key) => {
            const pattern = new RegExp(keywords[key], "i");
            const match = materials.find((p) => pattern.test(p.material));
            return { key, label: key.charAt(0).toUpperCase() + key.slice(1), item: match };
        });
    }, [materials]);

    if (!loading && materials.length === 0) {
        return (
            <div className="space-y-6">
                <PanelStatus loading={loading} error={error} source={source} onRetry={refresh} />
                <EmptyState
                    title="No price data yet"
                    description="Run npm run seed for reference catalog prices, or check back when partner shops publish their buy rates."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PanelStatus loading={loading} error={error} source={source} onRetry={refresh} />
            <p className="text-sm text-[#72796e] max-w-2xl">
                Live catalog and partner shop rates. Prices vary by condition and volume.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {highlightRows.map(({ key, label, item }) => (
                    <div
                        key={key}
                        className="min-w-0 bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4"
                    >
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#72796e]">
                            {label}
                        </p>
                        <p className="text-sm font-bold text-emerald-900 mt-1">
                            {item ? item.perKgPrice : "—"}
                        </p>
                        <p className="text-[10px] text-[#72796e] mt-1">per kg (est.)</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {priceCategories.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeCategory === cat.id
                            ? "bg-[#154212] text-white"
                            : "bg-white border border-zinc-200 text-[#42493e] hover:border-emerald-300"
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrices.map((item) => {
                    const trend =
                        item.price != null
                            ? getMaterialTrend(item)
                            : ["up", "down", "stable"][
                            (item.id?.length || 0) % 3
                            ];
                    const mid = parsePriceMid(item.perKgPrice);
                    const updatedLabel = formatUpdatedDate(item.updatedAt);

                    return (
                        <div
                            key={item.id}
                            className="min-w-0 bg-white border border-zinc-200 rounded-xl p-4 sm:p-5"
                        >
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                                        {item.category}
                                    </span>
                                    <h3 className="font-bold text-[#191c1c] mt-0.5">
                                        {item.material}
                                    </h3>
                                </div>
                                <TrendBadge trend={trend} />
                            </div>

                            <p className="text-2xl font-bold text-emerald-900">
                                {item.perKgPrice}
                                <span className="text-sm font-semibold text-[#72796e] ml-1">
                                    / kg
                                </span>
                            </p>

                            <p className="text-xs text-[#72796e] mt-2">
                                Est. midpoint: ₱{mid}/kg • Updated {updatedLabel}
                            </p>

                            <p className="text-sm text-[#42493e] mt-3">{item.examples}</p>
                            <p className="text-xs text-[#72796e] mt-2 italic">{item.notes}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function RecyclingGuidePanel() {
    return (
        <div className="space-y-8">
            <p className="text-sm text-[#72796e] max-w-2xl">
                Beginner-friendly guide to sorting waste, preparing materials for junkshops, and
                understanding your environmental impact.
            </p>

            <section>
                <h3 className="text-base font-bold text-[#191c1c] mb-4 flex items-center gap-2">
                    <Leaf size={18} className="text-emerald-600" />
                    Recycling steps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recyclingSteps.map((step) => (
                        <div
                            key={step.number}
                            className="bg-[#f9f9f8] border border-zinc-200 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                                    {step.number}
                                </span>
                                <span className="text-xl" aria-hidden="true">
                                    {step.icon}
                                </span>
                                <h4 className="font-bold text-[#191c1c]">{step.title}</h4>
                            </div>
                            <p className="text-sm text-[#42493e]">{step.description}</p>
                            <ul className="mt-2 space-y-1">
                                {step.tips.map((tip) => (
                                    <li
                                        key={tip}
                                        className="text-xs text-[#72796e] flex items-start gap-1.5"
                                    >
                                        <span className="text-emerald-600 mt-0.5">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="text-base font-bold text-[#191c1c] mb-4">
                    Material categories
                </h3>
                <div className="space-y-4">
                    {materialGuides.map((guide) => (
                        <div
                            key={guide.material}
                            className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5"
                        >
                            <h4 className="font-bold text-emerald-900 mb-3">{guide.material}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-bold uppercase text-emerald-700 mb-2 flex items-center gap-1">
                                        <CheckCircle2 size={14} />
                                        Accepted
                                    </p>
                                    <ul className="space-y-1 text-[#42493e]">
                                        {guide.accepted.map((item) => (
                                            <li key={item}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-red-700 mb-2 flex items-center gap-1">
                                        <XCircle size={14} />
                                        Not accepted
                                    </p>
                                    <ul className="space-y-1 text-[#42493e]">
                                        {guide.notAccepted.map((item) => (
                                            <li key={item}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-[#72796e] mb-2">
                                        Preparation
                                    </p>
                                    <p className="text-[#42493e]">{guide.prep}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 sm:p-5">
                    <h3 className="font-bold text-[#154212] mb-3 flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        Do&apos;s
                    </h3>
                    <ul className="space-y-2">
                        {recyclingDos.map((item) => (
                            <li key={item} className="text-sm text-[#42493e] flex gap-2">
                                <span className="text-emerald-600 shrink-0">✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 sm:p-5">
                    <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                        <XCircle size={18} />
                        Don&apos;ts
                    </h3>
                    <ul className="space-y-2">
                        {recyclingDonts.map((item) => (
                            <li key={item} className="text-sm text-[#42493e] flex gap-2">
                                <span className="text-red-600 shrink-0">✗</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="bg-[#2d5a27] text-white rounded-xl p-5 sm:p-6">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                    <AlertCircle size={20} />
                    Environmental impact
                </h3>
                <p className="text-sm text-emerald-100 leading-relaxed">
                    Every kilogram you divert from landfills reduces methane from mixed waste and
                    saves energy versus making products from virgin materials. Recycling one ton of
                    paper can save roughly 17 trees worth of pulp; aluminum cans can be recycled
                    indefinitely with far less energy than smelting new ore. Sorting correctly helps
                    junkshops process faster, which means more material actually gets recycled
                    instead of rejected as contaminated loads.
                </p>
            </section>
        </div>
    );
}

const LOG_MATERIALS = [
    { label: "PET Bottles (Clear)", rate: 17.5 },
    { label: "Aluminum Cans", rate: 52.5 },
    { label: "Cardboard", rate: 10 },
    { label: "Mixed Paper", rate: 6.5 },
    { label: "Scrap Metal (Iron)", rate: 42.5 },
    { label: "Glass Bottles", rate: 10 },
    { label: "Copper Wire", rate: 315 },
    { label: "Hard Plastic", rate: 12.5 },
];

function formatTripDate(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function LogTripPanel({ shops = [], onSubmit }) {
    const [material, setMaterial] = useState(LOG_MATERIALS[0].label);
    const [weight, setWeight] = useState("");
    const [shopId, setShopId] = useState(shops[0]?._id || shops[0]?.id || "");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [error, setError] = useState("");

    const selectedMaterial = LOG_MATERIALS.find((item) => item.label === material);
    const weightNum = Number(weight);
    const estimated =
        selectedMaterial && weightNum > 0
            ? (weightNum * selectedMaterial.rate).toFixed(2)
            : null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const selectedShop = shops.find(
            (s) => String(s._id || s.id) === String(shopId)
        );
        if (!material || !selectedShop) {
            setError("Please select a material and junkshop.");
            return;
        }
        if (!weightNum || weightNum <= 0) {
            setError("Enter a valid weight in kilograms.");
            return;
        }

        onSubmit({
            junkshopId: selectedShop._id || selectedShop.id,
            material,
            weightKg: weightNum,
            pricePerUnit: selectedMaterial?.rate || 0,
            date: formatTripDate(date),
            shop: selectedShop.name,
            weight: `${weightNum} kg`,
            amount: `₱${estimated}`,
            status: "Processing",
        });
    };

    return (
        <div className="space-y-6 max-w-xl">
            <p className="text-sm text-[#72796e]">
                Record a recycling trip you made. Saved to your account and shown in History.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#42493e]">
                        Material sold
                    </label>
                    <select
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                    >
                        {LOG_MATERIALS.map((item) => (
                            <option key={item.label} value={item.label}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#42493e]">
                            Weight (kg)
                        </label>
                        <NumberInput
                            min={0.1}
                            step={0.1}
                            value={weight}
                            onChange={setWeight}
                            placeholder="e.g. 12.5"
                            inputClassName="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#42493e]">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#42493e]">
                        Junkshop
                    </label>
                    <select
                        value={shopId}
                        onChange={(e) => setShopId(e.target.value)}
                        className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                    >
                        {shops.map((s) => (
                            <option key={s.id} value={s._id || s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                {estimated && (
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                        <ReceiptText size={20} className="text-emerald-700 shrink-0" />
                        <p className="text-sm text-[#42493e]">
                            Estimated payout:{" "}
                            <span className="font-bold text-emerald-800">₱{estimated}</span>
                            <span className="text-[#72796e]"> (based on typical rates)</span>
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
                    className="w-full sm:w-auto bg-[#154212] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors"
                >
                    Save trip
                </button>
            </form>
        </div>
    );
}

export const OVERVIEW_PANELS = {
    junkshops: {
        title: "Find Nearby Junkshops",
        Component: JunkshopsPanel,
    },
    prices: {
        title: "Material Prices",
        Component: MaterialPricesPanel,
    },
    guide: {
        title: "Recycling Guide",
        Component: RecyclingGuidePanel,
    },
};
