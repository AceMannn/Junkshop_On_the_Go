import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { compressVerificationImage } from "../../utils/compressVerificationImage";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export default function ImageDocumentUpload({
    preview,
    onPreviewChange,
    onClear,
    onError,
    label = "Upload image",
    helperText = "Tap to upload a clear photo or scan (max 20MB)",
    disabled = false,
    alt = "Document preview",
}) {
    const inputRef = useRef(null);
    const [processing, setProcessing] = useState(false);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !file.type.startsWith("image/")) return;

        if (file.size > MAX_FILE_BYTES) {
            onError?.("Each image must be 20MB or smaller. Try a smaller photo.");
            return;
        }

        setProcessing(true);
        try {
            const compressed = await compressVerificationImage(file);
            onPreviewChange?.(compressed.dataUrl, compressed.fileName, compressed.mimeType);
        } catch (compressError) {
            onError?.(compressError.message || "Could not process image. Try another photo.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#42493e]">{label}</label>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || processing}
                onChange={handleFile}
            />
            {preview ? (
                <div className="relative w-full max-w-[240px]">
                    <div className="rounded-xl border border-[#c2c9bb] bg-white overflow-hidden p-2">
                        <img
                            src={preview}
                            alt={alt}
                            className="max-w-full max-h-52 w-auto h-auto object-contain mx-auto"
                        />
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                            aria-label="Remove image"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled || processing}
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 w-full max-w-[240px] aspect-[4/3] rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <Loader2 className="w-7 h-7 text-emerald-700 animate-spin" />
                    ) : (
                        <Camera className="w-7 h-7 text-emerald-700" />
                    )}
                    <span className="text-xs font-semibold text-[#154212] text-center px-3">
                        {helperText}
                    </span>
                </button>
            )}
        </div>
    );
}
