import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImageDataUrl } from '../../utils/cropImage';

export default function ImageCropModal({ imageSrc, fileName = 'photo.jpg', onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      onComplete?.({
        fileName: fileName.replace(/\.\w+$/, '') + '.jpg',
        mimeType: 'image/jpeg',
        data: dataUrl,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[#f9f9f8]">
          <div>
            <p className="font-bold text-[#191c1c]">Crop photo</p>
            <p className="text-xs text-[#72796e]">Drag to reposition · pinch or scroll to zoom</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-zinc-200"
            aria-label="Cancel crop"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative h-64 sm:h-72 bg-zinc-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-4 py-3 border-t bg-white space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-[#72796e] shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-emerald-700"
              aria-label="Zoom"
            />
            <ZoomIn size={16} className="text-[#72796e] shrink-0" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-[#42493e]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !croppedAreaPixels}
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-[#154212] text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {saving ? 'Saving…' : 'Use photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
