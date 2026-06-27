import { AlertTriangle, X } from 'lucide-react';

/**
 * Confirmation popup shown when a customer taps "Book now" on a shop
 * that hasn't been fully verified by admin yet.
 */
export default function ConfirmUnverifiedShopModal({ shop, onConfirm, onCancel }) {
  if (!shop) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-[#191c1c]">Shop not yet fully verified</h3>
            <p className="mt-1 text-sm text-[#72796e]">
              <strong>{shop.name}</strong> has a pending verification with our team. Pricing and
              details may change once approved. Do you still want to proceed?
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-[#42493e] hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#154212] py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
}
