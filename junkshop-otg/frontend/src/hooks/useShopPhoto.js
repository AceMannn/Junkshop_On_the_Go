import { useEffect, useState } from 'react';
import { domainApi } from '../services/api';

function imageSrc(data, mimeType = 'image/jpeg') {
  if (!data) return '';
  if (data.startsWith('data:')) return data;
  if (/^https?:\/\//i.test(data)) return data;
  return `data:${mimeType || 'image/jpeg'};base64,${data}`;
}

export function useShopPhoto(shop) {
  const existing = shop?.shopPhotoUrl || '';
  const shopId = shop?._id || shop?.id || '';
  const [photoUrl, setPhotoUrl] = useState(existing);

  useEffect(() => {
    let cancelled = false;
    setPhotoUrl(existing);

    if (existing || !shopId) {
      return () => {
        cancelled = true;
      };
    }

    domainApi
      .getJunkshopPhoto(shopId)
      .then((payload) => {
        if (!cancelled) {
          setPhotoUrl(imageSrc(payload.data, payload.mimeType));
        }
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [existing, shopId]);

  return photoUrl;
}
