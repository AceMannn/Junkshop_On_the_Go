import { useRef, useState } from 'react';
import { Camera, Crop, RefreshCw, Trash2, Plus } from 'lucide-react';
import ImageCropModal from './ImageCropModal';

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MaterialPhotoUploader({ photos, onChange, maxPhotos = 3 }) {
  const inputRef = useRef(null);
  const [pendingCrop, setPendingCrop] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [error, setError] = useState('');

  const openFilePicker = (index = null) => {
    setReplaceIndex(index);
    inputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Each image must be 20MB or smaller.');
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setPendingCrop({ src: dataUrl, fileName: file.name, targetIndex: replaceIndex });
    setReplaceIndex(null);
  };

  const applyPhoto = (photo, targetIndex) => {
    const next = [...photos];
    if (targetIndex != null && targetIndex >= 0 && targetIndex < maxPhotos) {
      next[targetIndex] = photo;
    } else if (next.length < maxPhotos) {
      next.push(photo);
    }
    onChange(next.slice(0, maxPhotos));
  };

  const handleCropComplete = (photo) => {
    const target = cropIndex ?? pendingCrop?.targetIndex ?? null;
    applyPhoto(photo, target);
    setPendingCrop(null);
    setCropIndex(null);
  };

  const handleRemove = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const handleRecrop = (index) => {
    setCropIndex(index);
    setPendingCrop({
      src: photos[index].data,
      fileName: photos[index].fileName,
      targetIndex: index,
    });
  };

  const slots = Array.from({ length: maxPhotos }, (_, index) => photos[index] || null);
  const cropSource = pendingCrop?.src || null;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {slots.map((photo, index) =>
          photo ? (
            <div
              key={`photo-${index}-${photo.fileName}`}
              className="relative rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden group"
            >
              <img
                src={photo.data}
                alt={`Material ${index + 1}`}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex gap-1 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <button
                  type="button"
                  onClick={() => handleRecrop(index)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/95 text-[10px] font-bold text-[#154212]"
                  title="Crop again"
                >
                  <Crop size={12} />
                  Crop
                </button>
                <button
                  type="button"
                  onClick={() => openFilePicker(index)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/95 text-[10px] font-bold text-[#42493e]"
                  title="Replace photo"
                >
                  <RefreshCw size={12} />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-600 text-white"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              key={`empty-${index}`}
              type="button"
              onClick={() => openFilePicker(null)}
              className="flex flex-col items-center justify-center gap-2 aspect-[4/3] rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Plus size={20} />
              </div>
              <span className="text-xs font-semibold text-[#154212]">Add photo</span>
            </button>
          )
        )}
      </div>

      {photos.length === 0 && (
        <button
          type="button"
          onClick={() => openFilePicker(null)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-sm font-semibold text-[#154212] hover:bg-emerald-50"
        >
          <Camera size={18} />
          Upload material photo
        </button>
      )}

      <p className="text-xs text-[#72796e] leading-relaxed">
        Take clear photos of your recyclables. You can crop, replace, or remove any photo before
        submitting — double-check so nothing personal or sensitive is visible.
      </p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {cropSource && (
        <ImageCropModal
          imageSrc={cropSource}
          fileName={pendingCrop?.fileName}
          onComplete={handleCropComplete}
          onCancel={() => {
            setPendingCrop(null);
            setCropIndex(null);
          }}
        />
      )}
    </div>
  );
}
