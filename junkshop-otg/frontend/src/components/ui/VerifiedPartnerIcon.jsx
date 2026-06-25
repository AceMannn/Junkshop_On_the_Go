import { Check } from "lucide-react";

/**
 * Blue circle with a proportionally large white check —
 * Shopee-style verified badge. Show only when shop.badges?.includes('verified').
 *
 * Sizes:
 *   sm  — 14×14px circle,  9px check  (inline with small name text)
 *   md  — 18×18px circle, 12px check  (inline with base name text)
 *   lg  — 22×22px circle, 15px check  (hero / profile)
 */
export default function VerifiedPartnerIcon({ size = "md", className = "" }) {
    const styles = {
        sm: { box: "w-3.5 h-3.5", stroke: 3.5, icon: 9  },
        md: { box: "w-[18px] h-[18px]", stroke: 3, icon: 12 },
        lg: { box: "w-[22px] h-[22px]", stroke: 3, icon: 15 },
    };
    const s = styles[size] || styles.md;

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 text-white ${s.box} ${className}`}
            title="Verified by admin"
            aria-label="Verified partner"
        >
            <Check size={s.icon} strokeWidth={s.stroke} />
        </span>
    );
}

/** Helper — use this everywhere instead of shop.isPartner for the badge. */
export function isVerified(shop) {
    return Array.isArray(shop?.badges) && shop.badges.includes("verified");
}
