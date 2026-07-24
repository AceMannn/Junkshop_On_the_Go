import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    MapPin,
    Search,
    Map,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    XCircle,
    Leaf,
    AlertCircle,
    RefreshCw,
    SlidersHorizontal,
    LayoutGrid,
    Table2,
} from "lucide-react";
import { Heart } from "lucide-react";
import JunkshopsMap from "../maps/JunkshopsMap";
import EmptyState from "../ui/EmptyState";
import ShopRating from "../ui/ShopRating";
import VerifiedPartnerIcon, { isVerified } from "../ui/VerifiedPartnerIcon";
import { isFavoriteShopId } from "../../utils/favorites";
import { priceCategories } from "../../data/prices";
import { useCatalogJunkshops, useFeaturedMaterials } from "../../hooks/useCatalogData";
import {
    formatUpdatedDate,
    formatMaterialCategoryLabel,
    getMaterialTrend,
    normalizeMaterialCategory,
    shopStatusBadgeClass,
} from "../../utils/catalogMappers";
import { getMaterialCategoryColors } from "../../utils/materialCategoryColors";
import { matchesPrefixWordSearch } from "../../utils/searchFilter";
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

const DISTANCE_FILTERS = [
    { id: "5", label: "Within 5 km", value: 5 },
    { id: "10", label: "Within 10 km", value: 10 },
    { id: "20", label: "Within 20 km", value: 20 },
    { id: "all", label: "Any distance", value: null },
];

const HIGHLIGHT_CATEGORIES = [
    { id: "plastic", label: "Plastic" },
    { id: "paper", label: "Paper" },
    { id: "metal", label: "Metal" },
    { id: "glass", label: "Glass" },
    { id: "e-waste", label: "E-waste" },
    { id: "tires", label: "Tires" },
];

function parsePriceMid(perKgPrice) {
    const match = perKgPrice.match(/₱(\d+)/);
    return match ? Number(match[1]) : 0;
}

function materialUnitLabel(item) {
    return item?.unit === "piece" ? "piece" : "kg";
}

function PanelStatus({ loading, error, onRetry }) {
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
        <div className="fixed inset-x-0 bottom-0 top-16 z-20 flex flex-col bg-white md:left-[var(--dashboard-sidebar-offset)] transition-[left] duration-300">
            <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4 border-b border-zinc-200 shrink-0 bg-white">
                <button
                    type="button"
                    onClick={onClose}
                    className="md:hidden shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#154212] hover:bg-emerald-50 transition-colors"
                    aria-label="Close panel"
                >
                    <ArrowLeft size={18} />
                </button>
                <h2 className="flex-1 min-w-0 text-base sm:text-xl font-bold text-[#191c1c] truncate">
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

const MATERIAL_FILTERS = [
    { id: "all", label: "All materials" },
    { id: "plastic", label: "Plastic" },
    { id: "paper", label: "Paper" },
    { id: "metal", label: "Metal" },
    { id: "glass", label: "Glass" },
    { id: "e-waste", label: "E-waste" },
    { id: "tires", label: "Tires" },
];

const SORT_OPTIONS = [
    { id: "default", label: "Default" },
    { id: "open_first", label: "Open first" },
    { id: "nearest", label: "Nearest" },
    { id: "rating", label: "Highest rated" },
];

const filterSelectClass =
    "bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-3 py-2.5 text-sm font-medium text-[#42493e] outline-none focus:ring-2 focus:ring-[#154212]";

export function JunkshopsPanel({
    user = null,
    favoriteIds = [],
    onToggleFavorite,
    initialShopId = null,
    autoRouteShopId = null,
    onRouteDrawn,
    onViewProfile,
}) {
    const savedOrigin = useMemo(() => {
        const lat = Number(user?.location?.lat);
        const lng = Number(user?.location?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return {
            lat,
            lng,
            label: user?.address || "Saved profile address",
            source: "profile",
        };
    }, [user?.address, user?.location?.lat, user?.location?.lng]);
    const [originOverride, setOriginOverride] = useState(null);
    const effectiveOrigin = originOverride || savedOrigin;
    const { shops, loading, error, source, refresh } = useCatalogJunkshops({
        partnersOnly: true,
        originCoordinates: effectiveOrigin,
    });
    const [query, setQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [distanceFilter, setDistanceFilter] = useState("5");
    const [materialFilter, setMaterialFilter] = useState("all");
    const [sortBy, setSortBy] = useState("default");
    const [selectedMapId, setSelectedMapId] = useState(initialShopId);
    const [pendingRouteId, setPendingRouteId] = useState(null);
    const effectiveRouteId = autoRouteShopId || pendingRouteId;

    useEffect(() => {
        if (!initialShopId) return undefined;
        const timer = window.setTimeout(() => setSelectedMapId(initialShopId), 0);
        return () => window.clearTimeout(timer);
    }, [initialShopId]);

    const filteredShops = useMemo(() => {
        const distanceLimit = DISTANCE_FILTERS.find((item) => item.id === distanceFilter)?.value ?? null;
        let result = shops.filter((shop) => {
            const q = query.trim().toLowerCase();
            const matchesQuery =
                !q ||
                matchesPrefixWordSearch([shop.name, shop.address, shop.materials], q);

            const addressLower = shop.address.toLowerCase();
            const matchesLocation =
                locationFilter === "all" ||
                (locationFilter === "teresa" && addressLower.includes("teresa")) ||
                (locationFilter === "sta-mesa" && addressLower.includes("sta. mesa"));

            const matchesMaterial =
                materialFilter === "all" ||
                shop.materials.some((m) =>
                    m.toLowerCase() === materialFilter ||
                    m.toLowerCase().includes(materialFilter)
                );

            const matchesDistance =
                distanceLimit == null ||
                (Number.isFinite(Number(shop.distanceKm)) && Number(shop.distanceKm) <= distanceLimit);

            return matchesQuery && matchesLocation && matchesMaterial && matchesDistance;
        });

        if (sortBy === "open_first") {
            result = [...result].sort((a, b) => {
                const aOpen = a.status === "Open" ? 0 : 1;
                const bOpen = b.status === "Open" ? 0 : 1;
                return aOpen - bOpen;
            });
        } else if (sortBy === "nearest") {
            result = [...result].sort((a, b) => {
                if (a.distanceKm == null && b.distanceKm == null) return 0;
                if (a.distanceKm == null) return 1;
                if (b.distanceKm == null) return -1;
                return a.distanceKm - b.distanceKm;
            });
        } else if (sortBy === "rating") {
            result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return result;
    }, [shops, query, locationFilter, distanceFilter, materialFilter, sortBy]);

    const hasActiveFilters =
        query.trim() ||
        locationFilter !== "all" ||
        distanceFilter !== "5" ||
        materialFilter !== "all" ||
        sortBy !== "default";

    return (
        <div className="space-y-6">
            <PanelStatus loading={loading} error={error} source={source} onRetry={refresh} />

            {/* Map follows the same visible shop filters as the cards. */}
            {!loading ? (
                <JunkshopsMap
                    shops={filteredShops}
                    selectedId={selectedMapId}
                    onSelectShop={setSelectedMapId}
                    routingEnabled
                    autoRouteShopId={effectiveRouteId}
                    initialOrigin={effectiveOrigin}
                    onOriginChange={setOriginOverride}
                    onRouteDrawn={() => {
                        setPendingRouteId(null);
                        onRouteDrawn?.();
                    }}
                    className="fluid-map-min-height w-full"
                />
            ) : (
                <div className="rounded-xl border border-emerald-200 bg-zinc-50 fluid-map-min-height flex items-center justify-center text-sm text-[#72796e]">
                    Loading map…
                </div>
            )}

            {/* Available Junkshops section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-[#191c1c]">Available Junkshops</h3>
                        <p className="text-xs text-[#72796e] mt-0.5">
                            {loading
                                ? "Loading shops…"
                                : `${filteredShops.length} shop${filteredShops.length !== 1 ? "s" : ""}${hasActiveFilters ? " matching filters" : ""}`}
                        </p>
                    </div>
                    <SlidersHorizontal size={16} className="text-[#72796e] shrink-0" />
                </div>

                {/* Filters row */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-3 py-2.5 gap-2 min-w-0">
                        <Search size={16} className="text-[#72796e] shrink-0" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search junkshop, material, or address…"
                            className="w-full bg-transparent outline-none text-sm min-w-0"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:gap-2">
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className={filterSelectClass}
                            aria-label="Area filter"
                        >
                            {LOCATION_FILTERS.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={distanceFilter}
                            onChange={(e) => setDistanceFilter(e.target.value)}
                            className={filterSelectClass}
                            aria-label="Distance range"
                        >
                            {DISTANCE_FILTERS.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className={filterSelectClass}
                            aria-label="Material filter"
                        >
                            {MATERIAL_FILTERS.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={filterSelectClass}
                            aria-label="Sort order"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {filteredShops.length === 0 ? (
                    <EmptyState
                        compact
                        title={shops.length === 0 ? "No partner shops yet" : "No shops match your filters"}
                        description={
                            shops.length === 0
                                ? "Approved junkshops appear here after admin review."
                                : "Try adjusting your search or clearing the filters."
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredShops.map((shop) => (
                            <article
                                key={shop.id}
                                className={`bg-[#f9f9f8] border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                                    selectedMapId === shop.id
                                        ? "border-emerald-500 ring-2 ring-emerald-200"
                                        : "border-zinc-200 hover:border-emerald-300"
                                }`}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <h3 className="font-bold text-[#191c1c] text-sm truncate leading-snug">
                                                {shop.name}
                                            </h3>
                                            {isVerified(shop) && (
                                                <VerifiedPartnerIcon size="sm" />
                                            )}
                                        </div>
                                        <p className="text-xs text-[#72796e] flex items-start gap-1 mt-1 leading-snug">
                                            <MapPin size={12} className="shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{shop.address}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {onToggleFavorite && (
                                            <button
                                                type="button"
                                                onClick={() => onToggleFavorite(shop.id)}
                                                className={`p-1.5 rounded-full ${
                                                    isFavoriteShopId(shop.id, favoriteIds)
                                                        ? "text-red-600"
                                                        : "text-zinc-400 hover:text-red-500"
                                                }`}
                                                aria-label="Toggle favorite"
                                            >
                                                <Heart
                                                    size={14}
                                                    fill={isFavoriteShopId(shop.id, favoriteIds) ? "currentColor" : "none"}
                                                />
                                            </button>
                                        )}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${shopStatusBadgeClass(shop.status)}`}>
                                            {shop.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                    {shop.distance && (
                                        <span className="font-semibold text-emerald-700">{shop.distance}</span>
                                    )}
                                    {shop.distance && <span className="text-zinc-300">•</span>}
                                    <span className="text-[#72796e]">{shop.hours}</span>
                                    <span className="text-zinc-300">•</span>
                                    <ShopRating shop={shop} />
                                </div>

                                {/* Material chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {shop.materials.length > 0 ? (
                                        shop.materials.slice(0, 4).map((material) => (
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
                                    {shop.materials.length > 4 && (
                                        <span className="text-[10px] text-[#72796e]">
                                            +{shop.materials.length - 4} more
                                        </span>
                                    )}
                                </div>

                                {/* Actions — pushed to bottom */}
                                <div className="mt-auto flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => onViewProfile?.(shop)}
                                        className="flex-1 inline-flex items-center justify-center py-2 bg-[#154212] text-white rounded-lg text-xs font-bold hover:bg-emerald-900 transition-colors"
                                    >
                                        View Shop Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMapId(shop.id);
                                            setPendingRouteId(shop.id);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="inline-flex items-center justify-center gap-1 py-2 px-3 border border-zinc-300 text-[#42493e] rounded-lg text-xs font-bold hover:bg-zinc-50 transition-colors"
                                    >
                                        <Map size={13} />
                                        Route
                                    </button>
                                </div>
                            </article>
                        ))}
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
    const { materials, loading, error, refresh } = useFeaturedMaterials();
    const [activeCategory, setActiveCategory] = useState("all");
    const [viewMode, setViewMode] = useState("cards");
    const [search, setSearch] = useState("");

    const filteredPrices = useMemo(() => {
        const query = search.trim().toLowerCase();
        return materials.filter((item) => {
            const category = normalizeMaterialCategory(item.category, item.material);
            const matchesCategory = activeCategory === "all" || category === activeCategory;
            if (!matchesCategory) return false;
            if (!query) return true;
            return matchesPrefixWordSearch(
                [
                    item.material,
                    formatMaterialCategoryLabel(item.category),
                    item.examples,
                ],
                query
            );
        });
    }, [materials, activeCategory, search]);

    const highlightRows = useMemo(() => {
        return HIGHLIGHT_CATEGORIES.map((category) => {
            const match = materials.find(
                (item) => normalizeMaterialCategory(item.category, item.material) === category.id
            );
            return { ...category, item: match };
        });
    }, [materials]);

    if (!loading && materials.length === 0) {
        return (
            <div className="space-y-6">
                <PanelStatus loading={loading} error={error} source="api" onRetry={refresh} />
                <EmptyState
                    title="No price data yet"
                    description="Run npm run seed for reference catalog prices, or check back when partner shops publish their buy rates."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PanelStatus loading={loading} error={error} source="api" onRetry={refresh} />
            <p className="text-sm text-[#72796e] max-w-2xl">
                Live catalog and partner shop rates. Prices vary by condition and volume.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {highlightRows.map(({ id, label, item }) => (
                    <div
                        key={id}
                        className="min-w-0 bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4"
                    >
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#72796e]">
                            {label}
                        </p>
                        <p className="text-sm font-bold text-emerald-900 mt-1">
                            {item ? item.perKgPrice : "—"}
                        </p>
                        <p className="text-[10px] text-[#72796e] mt-1">
                            per {materialUnitLabel(item)} (est.)
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center bg-white border border-zinc-200 px-3 py-2 rounded-xl w-full lg:flex-1 lg:min-w-0">
                    <Search size={18} className="text-[#72796e] mr-2 shrink-0" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="outline-none text-sm w-full bg-transparent"
                        placeholder="Search materials..."
                        aria-label="Search materials"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={activeCategory}
                        onChange={(event) => setActiveCategory(event.target.value)}
                        className="h-10 min-w-[10rem] flex-1 sm:flex-none rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-[#42493e] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        aria-label="Filter by category"
                    >
                        {priceCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>

                    <div className="hidden md:inline-flex h-10 w-fit shrink-0 rounded-xl border border-zinc-200 bg-white p-0.5 shadow-sm">
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
                        <LayoutGrid size={13} />
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
                        <Table2 size={13} />
                        Table
                    </button>
                    </div>
                </div>
            </div>

            {filteredPrices.length === 0 ? (
                <EmptyState
                    compact
                    title="No materials match your search"
                    description="Try another keyword or reset the category filter."
                />
            ) : (
                <>
                    {viewMode === "table" && (
                        <div className="hidden md:block scroll-x-clean overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                            <table className="w-full min-w-[780px] text-sm">
                                <thead className="bg-[#f3f4f3] text-[#42493e]">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">Material</th>
                                        <th className="px-4 py-3 text-left font-semibold">Category</th>
                                        <th className="px-4 py-3 text-left font-semibold">Price</th>
                                        <th className="px-4 py-3 text-left font-semibold">Trend</th>
                                        <th className="px-4 py-3 text-left font-semibold">Examples</th>
                                        <th className="px-4 py-3 text-left font-semibold">Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredPrices.map((item) => {
                                        const trend =
                                            item.price != null
                                                ? getMaterialTrend(item)
                                                : ["up", "down", "stable"][
                                                (item.id?.length || 0) % 3
                                                ];
                                        const unitLabel = materialUnitLabel(item);
                                        const mid = parsePriceMid(item.perKgPrice);

                                        return (
                                            <tr key={item.id} className="hover:bg-zinc-50">
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-[#191c1c]">{item.material}</p>
                                                    <p className="text-xs text-[#72796e]">Midpoint: ₱{mid}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                                                        {formatMaterialCategoryLabel(item.category)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 font-bold text-emerald-900">
                                                    {item.perKgPrice}
                                                    <span className="ml-1 text-xs font-semibold text-[#72796e]">
                                                        / {unitLabel === "piece" ? "pc" : "kg"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <TrendBadge trend={trend} />
                                                </td>
                                                <td className="px-4 py-4 text-[#42493e]">
                                                    <span className="line-clamp-2">{item.examples}</span>
                                                </td>
                                                <td className="px-4 py-4 text-[#72796e]">
                                                    {formatUpdatedDate(item.updatedAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${viewMode === "table" ? "md:hidden" : ""}`}>
                {filteredPrices.map((item) => {
                    const trend =
                        item.price != null
                            ? getMaterialTrend(item)
                            : ["up", "down", "stable"][
                            (item.id?.length || 0) % 3
                            ];
                    const unitLabel = materialUnitLabel(item);
                    const mid = parsePriceMid(item.perKgPrice);
                    const updatedLabel = formatUpdatedDate(item.updatedAt);
                    const colors = getMaterialCategoryColors(
                        normalizeMaterialCategory(item.category, item.material)
                    );

                    return (
                        <div
                            key={item.id}
                            className={`min-w-0 border rounded-xl p-4 sm:p-5 ${colors.card}`}
                        >
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.badge}`}>
                                        {formatMaterialCategoryLabel(item.category)}
                                    </span>
                                    <h3 className="font-bold text-[#191c1c] mt-0.5">
                                        {item.material}
                                    </h3>
                                </div>
                                <TrendBadge trend={trend} />
                            </div>

                            <p className={`text-2xl font-bold ${colors.price}`}>
                                {item.perKgPrice}
                                <span className="text-sm font-semibold text-[#72796e] ml-1">
                                    / {unitLabel === "piece" ? "pc" : "kg"}
                                </span>
                            </p>

                            <p className="text-xs text-[#72796e] mt-2">
                                Est. midpoint: ₱{mid}/{unitLabel === "piece" ? "pc" : "kg"} • Updated {updatedLabel}
                            </p>

                            <p className="text-sm text-[#42493e] mt-3">{item.examples}</p>
                            <p className="text-xs text-[#72796e] mt-2 italic">{item.notes}</p>
                        </div>
                    );
                })}
            </div>
                </>
            )}
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

// eslint-disable-next-line react-refresh/only-export-components
export const OVERVIEW_PANELS = {
    junkshops: {
        title: "",
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
