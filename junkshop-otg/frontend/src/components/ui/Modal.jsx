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
    ? 'fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-charcoal/60 p-0 sm:px-4 sm:py-6'
    : 'fixed inset-0 z-[80] flex items-center justify-center bg-charcoal/60 px-4 py-6';

  const panelClass = mobileSheet
    ? `relative flex w-full ${sizeClasses[size]} max-h-[92dvh] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-[24px] sm:rounded-[24px] bg-white shadow-2xl`
    : `relative flex w-full ${sizeClasses[size]} max-h-[90vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl`;

  return (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={onClose}
    >
      <div
        className={panelClass}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-xl sm:text-2xl md:text-3xl">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm sm:text-base text-gray-600">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-light-gray text-charcoal transition-colors hover:bg-eco-green hover:text-white"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>
        <div className="scroll-y-clean flex-1 px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
