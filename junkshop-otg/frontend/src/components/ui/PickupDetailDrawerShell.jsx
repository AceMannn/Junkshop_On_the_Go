import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Side/bottom drawer for pickup details. Portaled to document.body so dashboard
 * overflow-x-hidden does not clip the panel on the right edge.
 */
export default function PickupDetailDrawerShell({ onClose, children }) {
    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-stretch md:justify-end overscroll-contain">
            <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label="Close pickup details"
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Pickup details"
                className="relative z-10 flex h-[92dvh] md:h-full w-full min-w-0 max-w-md shrink-0 flex-col overflow-hidden bg-white shadow-xl md:w-[min(100vw,28rem)]"
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </aside>
        </div>,
        document.body
    );
}
