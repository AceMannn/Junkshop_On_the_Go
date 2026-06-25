import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

export default function PickupMaterialPhotosGallery({ photos = [], title = 'Material photos' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const validPhotos = (photos || []).filter((photo) => photo?.data);

  if (validPhotos.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-[#f9f9f8] p-3 space-y-2">
        <p className="text-sm font-semibold text-[#191c1c]">{title}</p>
        <div className="grid grid-cols-3 gap-2">
          {validPhotos.map((photo, index) => (
            <button
              key={`${photo.fileName || 'photo'}-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="relative group rounded-lg overflow-hidden border border-zinc-200 aspect-[4/3] bg-white"
            >
              <img
                src={photo.data}
                alt={photo.fileName || `Material photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <ZoomIn
                  size={18}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex != null && validPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close preview"
          >
            <X size={22} />
          </button>
          <img
            src={validPhotos[lightboxIndex].data}
            alt={validPhotos[lightboxIndex].fileName || 'Material photo'}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
