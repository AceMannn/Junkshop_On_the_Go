import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, title, description, onClose, children, size = 'large' }) {
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
    fullscreen: 'max-w-[96rem] h-[92vh]',
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-charcoal/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={onClose}
    >
      <div
        className={`relative flex w-full ${sizeClasses[size]} max-h-[90vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="modal-title" className="text-2xl sm:text-3xl">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm sm:text-base text-gray-600">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-light-gray text-charcoal transition-colors hover:bg-eco-green hover:text-white"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
