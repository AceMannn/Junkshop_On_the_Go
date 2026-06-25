import { Clock, Phone, Tag, Star } from "lucide-react";
import ShopRating from "../ui/ShopRating";

const PRICE_CHIP = {
    plastic: "bg-blue-50 text-blue-700 border-blue-200",
    metal: "bg-amber-50 text-amber-700 border-amber-200",
    paper: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glass: "bg-teal-50 text-teal-700 border-teal-200",
    "e-waste": "bg-purple-50 text-purple-700 border-purple-200",
    other: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const PREVIEW_CHIP_LIMIT = 4;

export default function ShopCardPreviewDetails({ shop }) {
    const prices = shop.listingPrices || [];
    const previewPrices = prices.slice(0, PREVIEW_CHIP_LIMIT);
    const extraCount = prices.length - previewPrices.length;

    return (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
                {shop.hours && (
                    <div className="rounded-lg bg-[#f9f9f8] border border-zinc-100 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#72796e] mb-0.5">
                            <Clock size={12} />
                            Hours
                        </div>
                        <p className="text-xs font-semibold text-[#191c1c] leading-snug">{shop.hours}</p>
                    </div>
                )}
                <div className="rounded-lg bg-[#f9f9f8] border border-zinc-100 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#72796e] mb-0.5">
                        <Phone size={12} />
                        Phone
                    </div>
                    <p className="text-xs font-semibold text-[#191c1c] truncate">
                        {shop.phone || "—"}
                    </p>
                </div>
                {shop.topPrice && (
                    <div className="rounded-lg bg-[#f9f9f8] border border-zinc-100 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#72796e] mb-0.5">
                            <Tag size={12} />
                            Top price
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 leading-snug truncate">
                            {shop.topPrice}
                        </p>
                    </div>
                )}
                <div className="rounded-lg bg-[#f9f9f8] border border-zinc-100 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#72796e] mb-0.5">
                        <Star size={12} />
                        Rating
                    </div>
                    <div className="text-xs">
                        <ShopRating shop={shop} />
                    </div>
                </div>
            </div>

            {previewPrices.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#72796e] mb-2">
                        Sample prices
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {previewPrices.map((item, i) => {
                            const catKey = String(item.category || "other").toLowerCase();
                            const chipClass = PRICE_CHIP[catKey] || PRICE_CHIP.other;
                            return (
                                <span
                                    key={`${item.name}-${item.price}-${i}`}
                                    className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold ${chipClass}`}
                                >
                                    {item.name} ₱{item.price}/{item.unit || "kg"}
                                </span>
                            );
                        })}
                        {extraCount > 0 && (
                            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-[#72796e]">
                                +{extraCount} in profile
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
