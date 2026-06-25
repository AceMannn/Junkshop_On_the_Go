import { Heart, MapPin, Clock, Phone } from "lucide-react";
import VerifiedPartnerIcon, { isVerified } from "../ui/VerifiedPartnerIcon";
import ShopRating from "../ui/ShopRating";
import ShopBadges from "../ui/ShopBadges";
import { shopStatusBadgeClass } from "../../utils/catalogMappers";

const SHOP_IMAGE =
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop";

/**
 * Unified shop summary card used in both Overview Nearby and Favorites.
 *
 * Props:
 *   shop          – normalised shop object
 *   isFavorite    – boolean
 *   onToggleFavorite – () => void
 *   onViewProfile – () => void
 *   onRoute       – () => void
 *   className     – forwarded to root element for sizing / snap behaviour
 */
export default function CustomerShopSummaryCard({
    shop,
    isFavorite,
    onToggleFavorite,
    onViewProfile,
    onRoute,
    className = "",
}) {
    const heroSrc = shop.shopPhotoUrl || shop.image || SHOP_IMAGE;
    // Hide the text "Verified" badge when we already show the blue check icon
    const displayBadges = (shop.badges || []).filter((b) => b !== "verified");

    return (
        <div
            className={`@container bg-white border border-[#c2c9bb] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(141,170,145,0.15)] flex flex-col group ${className}`}
        >
            {/* ── Hero ── */}
            <div className="relative h-36 shrink-0 overflow-hidden bg-zinc-200">
                <img
                    alt={shop.name}
                    src={heroSrc}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status badge — top left */}
                {shop.status && (
                    <span
                        className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${shopStatusBadgeClass(shop.status)}`}
                    >
                        {shop.status}
                    </span>
                )}

                {/* Favourite heart — top right */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.();
                    }}
                    className={`absolute top-3 right-3 bg-white/90 backdrop-blur p-2 rounded-full transition-transform active:scale-90 hover:scale-110 ${
                        isFavorite ? "text-red-600" : "text-zinc-400"
                    }`}
                    aria-label="Toggle favourite"
                >
                    <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                </button>
            </div>

            {/* ── Body ── */}
            <div className="p-4 flex-1 flex flex-col gap-3">

                {/* Name + verified icon */}
                <div>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-[#191c1c] truncate text-sm sm:text-base leading-snug">
                            {shop.name}
                        </h4>
                        {isVerified(shop) && <VerifiedPartnerIcon size="sm" className="shrink-0" />}
                    </div>

                    {/* Text badges — Trusted Seller, Top Junkshop only (no Verified) */}
                    {displayBadges.length > 0 && (
                        <ShopBadges badges={displayBadges} className="mt-1.5" />
                    )}
                </div>

                {/* Star rating */}
                <ShopRating shop={shop} />

                {/* Info rows */}
                <div className="space-y-1.5 text-xs text-[#42493e]">
                    <div className="flex items-start gap-2">
                        <MapPin size={13} className="shrink-0 mt-0.5 text-[#72796e]" />
                        <span className="line-clamp-2 leading-snug">
                            {shop.address || "—"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock size={13} className="shrink-0 text-[#72796e]" />
                        <span className="line-clamp-1">{shop.hours || "—"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Phone size={13} className="shrink-0 text-[#72796e]" />
                        <span>{shop.phone || "N/A"}</span>
                    </div>
                </div>

                {/* Accepted materials */}
                {shop.materials?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {shop.materials.slice(0, 4).map((m) => (
                            <span
                                key={m}
                                className="bg-[#c9e7cc] text-[#4e6953] px-2 py-0.5 rounded-md text-[10px] font-medium"
                            >
                                {m}
                            </span>
                        ))}
                        {shop.materials.length > 4 && (
                            <span className="text-[10px] text-[#72796e] italic self-center">
                                +{shop.materials.length - 4} more
                            </span>
                        )}
                    </div>
                ) : (
                    <p className="text-[10px] text-[#72796e] italic">Materials not listed yet</p>
                )}

                {/* Action buttons */}
                <div className="flex flex-col @[20rem]:flex-row gap-2 mt-auto">
                    <button
                        type="button"
                        onClick={onViewProfile}
                        className="flex-1 py-2.5 bg-[#154212] text-white rounded-lg text-xs font-semibold whitespace-nowrap text-center hover:bg-[#1f5c19] transition-colors active:scale-95"
                    >
                        View Shop Profile
                    </button>
                    <button
                        type="button"
                        onClick={onRoute}
                        className="flex-1 py-2.5 border border-[#c2c9bb] text-[#42493e] rounded-lg text-xs font-semibold whitespace-nowrap text-center hover:bg-[#edeeed] transition-colors"
                    >
                        Route
                    </button>
                </div>
            </div>
        </div>
    );
}
