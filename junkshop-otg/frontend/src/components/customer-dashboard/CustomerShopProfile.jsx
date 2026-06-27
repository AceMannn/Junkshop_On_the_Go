import { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft,
    MapPin,
    Phone,
    Clock,
    Star,
    Navigation,
    Heart,
    ExternalLink,
    ShoppingBag,
    Info,
    MessageSquare,
    CheckCircle,
    Store,
    Tag,
} from "lucide-react";
import ShopRating from "../ui/ShopRating";
import ShopBadges from "../ui/ShopBadges";
import VerifiedPartnerIcon, { isVerified } from "../ui/VerifiedPartnerIcon";
import { shopDirectionsUrl, shopStatusBadgeClass } from "../../utils/catalogMappers";
import { getShopStatusLabel } from "../../utils/operatingHours";
import { maskCustomerName } from "../../utils/maskCustomerName";
import { isFavoriteShopId } from "../../utils/favorites";
import { domainApi } from "../../services/api";
import { useShopPhoto } from "../../hooks/useShopPhoto";

const TABS = [
    { id: "materials", label: "Materials", icon: ShoppingBag },
    { id: "about",     label: "About",     icon: Info          },
    { id: "reviews",   label: "Reviews",   icon: MessageSquare },
];

const CATEGORY_CHIP = {
    plastic:   "bg-blue-100 text-blue-700",
    metal:     "bg-amber-100 text-amber-700",
    paper:     "bg-emerald-100 text-emerald-700",
    glass:     "bg-teal-100 text-teal-700",
    "e-waste": "bg-purple-100 text-purple-700",
    other:     "bg-zinc-100 text-zinc-600",
};

function StarRow({ score }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    size={13}
                    className={n <= score ? "text-amber-400 fill-amber-400" : "text-zinc-300 fill-zinc-300"}
                />
            ))}
        </span>
    );
}

export default function CustomerShopProfile({
    shop,
    favoriteIds = [],
    onToggleFavorite,
    onBack,
    backLabel = "Back",
    onBookPickup,
}) {
    const [activeTab, setActiveTab] = useState("materials");
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");
    const [reviewsFetched, setReviewsFetched] = useState(false);

    const loadReviews = useCallback(async () => {
        if (reviewsFetched || !shop?.id) return;
        setReviewsLoading(true);
        setReviewsError("");
        try {
            const { reviews: rows } = await domainApi.getJunkshopReviews(shop.id, { limit: 20 });
            setReviews(rows || []);
            setReviewsFetched(true);
        } catch (err) {
            setReviewsError(err.message || "Could not load reviews.");
        } finally {
            setReviewsLoading(false);
        }
    }, [shop?.id, reviewsFetched]);

    useEffect(() => {
        if (activeTab === "reviews") {
            loadReviews();
        }
    }, [activeTab, loadReviews]);

    const heroPhoto = useShopPhoto(shop);

    if (!shop) return null;

    const isFav = isFavoriteShopId(shop.id, favoriteIds);
    const directionsUrl = shopDirectionsUrl(shop);
    const displayBadges = (shop.badges || []).filter((b) => b !== "verified");
    const statusLabel = getShopStatusLabel(shop);

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-20 flex flex-col bg-white md:left-56">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-zinc-200 shrink-0 bg-white z-10">
                <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#154212] hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors"
                >
                    <ArrowLeft size={17} />
                    <span className="hidden sm:inline">{backLabel}</span>
                    <span className="sm:hidden">Back</span>
                </button>
                <button
                    type="button"
                    onClick={() => onToggleFavorite?.(shop.id)}
                    className={`p-2 rounded-full transition-colors ${isFav ? "text-red-500" : "text-zinc-400 hover:text-red-400"}`}
                    aria-label="Toggle favorite"
                >
                    <Heart size={19} fill={isFav ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Scrollable content */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
                <div className="dashboard-panel-scroll h-full">

                {/* Hero */}
                <div className="relative h-44 sm:h-52 bg-zinc-200 overflow-hidden shrink-0">
                    {heroPhoto ? (
                        <img
                            src={heroPhoto}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-zinc-100">
                            <Store size={48} className="text-zinc-300" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <h1 className="text-white font-bold text-lg sm:text-xl leading-tight drop-shadow truncate">
                                    {shop.name}
                                </h1>
                                {isVerified(shop) && (
                                    <VerifiedPartnerIcon size="lg" className="ring-2 ring-white/40 shrink-0" />
                                )}
                            </div>
                            {displayBadges.length > 0 && (
                                <ShopBadges badges={displayBadges} className="mt-1" />
                            )}
                        </div>
                        <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${shopStatusBadgeClass(statusLabel)}`}>
                            {statusLabel}
                        </span>
                    </div>
                </div>

                {/* Quick info strip */}
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#42493e]">
                        {shop.distance && shop.distance !== "—" && (
                            <span className="font-semibold text-emerald-700">{shop.distance}</span>
                        )}
                        <ShopRating shop={shop} />
                        {shop.reviewCount > 0 && (
                            <span className="text-xs text-[#72796e]">
                                ({shop.reviewCount} review{shop.reviewCount !== 1 ? "s" : ""})
                            </span>
                        )}
                    </div>
                    {shop.address && (
                        <p className="flex items-start gap-1.5 text-sm text-[#72796e]">
                            <MapPin size={14} className="shrink-0 mt-0.5" />
                            {shop.address}
                        </p>
                    )}
                    {shop.hours && (
                        <p className="flex items-center gap-1.5 text-sm text-[#72796e]">
                            <Clock size={14} className="shrink-0" />
                            {shop.hours}
                        </p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="px-4 sm:px-6 py-3 border-b border-zinc-100 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onBookPickup?.(shop)}
                        className="inline-flex items-center gap-1.5 bg-[#154212] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-900 transition-colors"
                    >
                        <ShoppingBag size={15} />
                        Book Pickup
                    </button>
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 border border-[#154212] text-[#154212] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                        <Navigation size={15} />
                        Directions
                    </a>
                    {shop.phone && (
                        <a
                            href={`tel:${shop.phone.replace(/\D/g, "")}`}
                            className="inline-flex items-center gap-1.5 border border-zinc-300 text-[#42493e] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                            <Phone size={15} />
                            Call
                        </a>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 px-4 sm:px-6 shrink-0 gap-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? "border-[#154212] text-[#154212]"
                                        : "border-transparent text-[#72796e] hover:text-[#42493e]"
                                }`}
                            >
                                <Icon size={15} />
                                {tab.label}
                                {tab.id === "reviews" && shop.reviewCount > 0 && (
                                    <span className="text-[10px] bg-zinc-100 text-zinc-600 rounded-full px-1.5 py-0.5 font-bold">
                                        {shop.reviewCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="px-4 sm:px-6 py-5 pb-24 md:pb-8">

                    {/* Materials tab */}
                    {activeTab === "materials" && (
                        <div className="space-y-3">
                            {(!shop.listingPrices || shop.listingPrices.length === 0) ? (
                                <div className="text-center py-12 text-[#72796e]">
                                    <Tag size={32} className="mx-auto mb-2 text-zinc-300" />
                                    <p className="text-sm font-semibold">No materials listed yet</p>
                                    <p className="text-xs mt-1">This junkshop hasn't added price listings.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {shop.listingPrices.map((item, i) => {
                                        const catKey = String(item.category || "other").toLowerCase();
                                        const chipClass = CATEGORY_CHIP[catKey] || CATEGORY_CHIP.other;
                                        return (
                                            <div
                                                key={`${item.name}-${i}`}
                                                className="bg-[#f9f9f8] border border-zinc-200 rounded-xl p-4 flex flex-col gap-3"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${chipClass}`}>
                                                            {item.category || "Other"}
                                                        </span>
                                                        <p className="font-semibold text-[#191c1c] text-sm mt-1.5 truncate">
                                                            {item.name}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-lg font-bold text-emerald-700">
                                                            ₱{item.price}
                                                        </p>
                                                        <p className="text-xs text-[#72796e]">per {item.unit || "kg"}</p>
                                                    </div>
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-[#72796e] leading-relaxed">{item.notes}</p>
                                                )}
                                                {item.examples && (
                                                    <p className="text-xs text-[#72796e] italic">{item.examples}</p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onBookPickup?.(shop, item)}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#154212] text-white text-xs font-semibold py-2 rounded-lg hover:bg-emerald-900 transition-colors mt-auto"
                                                >
                                                    <ShoppingBag size={13} />
                                                    Book Pickup
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* About tab */}
                    {activeTab === "about" && (
                        <div className="space-y-4 max-w-lg">
                            <div className="bg-[#f9f9f8] rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden text-sm">
                                {shop.address && (
                                    <div className="flex items-start gap-3 px-4 py-3">
                                        <MapPin size={16} className="text-[#72796e] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#72796e] mb-0.5">Address</p>
                                            <p className="text-[#191c1c]">{shop.address}</p>
                                        </div>
                                    </div>
                                )}
                                {shop.phone && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <Phone size={16} className="text-[#72796e] shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#72796e] mb-0.5">Phone</p>
                                            <a href={`tel:${shop.phone.replace(/\D/g, "")}`} className="text-[#154212] font-semibold">
                                                {shop.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {shop.hours && (
                                    <div className="flex items-start gap-3 px-4 py-3">
                                        <Clock size={16} className="text-[#72796e] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#72796e] mb-0.5">Working Hours</p>
                                            <p className="text-[#191c1c]">{shop.hours}</p>
                                        </div>
                                    </div>
                                )}
                                {shop.materials?.length > 0 && (
                                    <div className="flex items-start gap-3 px-4 py-3">
                                        <Store size={16} className="text-[#72796e] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#72796e] mb-1.5">Accepted Materials</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {shop.materials.map((m) => (
                                                    <span key={m} className="bg-[#c9e7cc] text-[#4e6953] px-2 py-0.5 rounded-md text-[10px] font-medium">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {isVerified(shop) && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <CheckCircle size={16} className="text-blue-600 shrink-0" />
                                        <div>
                                            <p className="text-xs font-semibold text-blue-700">Verified Partner Shop</p>
                                            <p className="text-xs text-[#72796e]">Identity and shop documents confirmed by admin.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <a
                                href={shopDirectionsUrl(shop)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#154212] hover:underline"
                            >
                                <ExternalLink size={14} />
                                Open in Google Maps
                            </a>
                        </div>
                    )}

                    {/* Reviews tab */}
                    {activeTab === "reviews" && (
                        <div className="space-y-4 max-w-xl">
                            {/* Rating summary */}
                            {shop.rating > 0 && (
                                <div className="flex items-center gap-4 bg-[#f9f9f8] border border-zinc-200 rounded-xl px-5 py-4">
                                    <div className="text-center shrink-0">
                                        <p className="text-4xl font-bold text-[#191c1c]">{Number(shop.rating).toFixed(1)}</p>
                                        <StarRow score={Math.round(shop.rating)} />
                                        <p className="text-xs text-[#72796e] mt-1">{shop.reviewCount} review{shop.reviewCount !== 1 ? "s" : ""}</p>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = reviews.filter((r) => Math.round(r.score) === star).length;
                                            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-2 text-xs text-[#72796e]">
                                                    <span className="w-3">{star}</span>
                                                    <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                                                    <div className="flex-1 bg-zinc-200 rounded-full h-1.5">
                                                        <div
                                                            className="bg-amber-400 h-1.5 rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-6 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {reviewsLoading && (
                                <p className="text-sm text-[#72796e] py-4">Loading reviews…</p>
                            )}
                            {reviewsError && (
                                <p className="text-sm text-red-600">{reviewsError}</p>
                            )}
                            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                                <div className="text-center py-12 text-[#72796e]">
                                    <MessageSquare size={32} className="mx-auto mb-2 text-zinc-300" />
                                    <p className="text-sm font-semibold">No reviews yet</p>
                                    <p className="text-xs mt-1">Be the first to review after a completed pickup.</p>
                                </div>
                            )}
                            {!reviewsLoading && reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-[#f9f9f8] border border-zinc-200 rounded-xl px-4 py-3.5 space-y-1.5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-[#42493e] shrink-0 uppercase">
                                                {review.customerName?.[0] || "?"}
                                            </div>
                                            <p className="text-sm font-semibold text-[#191c1c]">
                                                {maskCustomerName(review.customerName)}
                                            </p>
                                        </div>
                                        <StarRow score={Math.round(review.score)} />
                                    </div>
                                    {review.comment ? (
                                        <p className="text-sm text-[#42493e] leading-relaxed pl-9">
                                            {review.comment}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-[#72796e] italic pl-9">No written comment.</p>
                                    )}
                                    <p className="text-xs text-[#72796e] pl-9">
                                        {new Date(review.createdAt).toLocaleDateString("en-PH", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </div>
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
