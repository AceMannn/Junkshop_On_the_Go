import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { imageSrc } from '../utils/format';

export default function VerificationDocumentImage({
  applicationId,
  kind,
  slot,
  alt,
  className = 'w-full rounded-xl border border-zinc-200 object-contain max-h-80 bg-zinc-50',
  emptyLabel = 'Not uploaded',
}) {
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);
    setSrc('');

    adminApi
      .getApplicationDocument(applicationId, kind, slot)
      .then((payload) => {
        if (cancelled) return;
        setSrc(imageSrc(payload.data, payload.mimeType));
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId, kind, slot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (missing || !src) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-400">
        {emptyLabel}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
