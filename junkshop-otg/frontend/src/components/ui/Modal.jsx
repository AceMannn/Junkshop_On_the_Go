import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
  size = 'large',
  mobileSheet = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    large: 'max-w-5xl',
    fullscreen: 'max-w-[96rem] sm:h-[92vh]',
  };

  const overlayClass = mobileSheet
    ? 'fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#191c1c]/55 backdrop-blur-sm p-0 sm:px-4 sm:py-6'
    : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#191c1c]/55 backdrop-blur-sm px-4 py-6';

  const panelClass = mobileSheet
    ? `relative flex w-full ${sizeClasses[size]} max-h-[92dvh] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-zinc-200`
    : `relative flex w-full ${sizeClasses[size]} max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200`;

  return (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={onClose}
    >
      <div className={panelClass} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 bg-[#f9f9f8] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-[#191c1c]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[#72796e]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[#72796e] transition-colors hover:bg-[#154212] hover:text-white"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="scroll-y-clean flex-1 px-5 py-5 sm:px-6 bg-white">{children}</div>
      </div>
    </div>
  );
}
