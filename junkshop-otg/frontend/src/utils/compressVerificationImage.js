const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESS_BYTES = 400 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = dataUrl;
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Resize and compress verification uploads for faster saves while keeping text readable.
 */
export async function compressVerificationImage(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Only image files are supported.');
  }

  if (file.size <= SKIP_COMPRESS_BYTES && file.type === 'image/jpeg') {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
      return {
        dataUrl,
        mimeType: file.type,
        fileName: file.name,
      };
    }
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process image.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToJpegBlob(canvas, JPEG_QUALITY);
  const compressedUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not compress image.'));
    reader.readAsDataURL(blob);
  });

  return {
    dataUrl: compressedUrl,
    mimeType: 'image/jpeg',
    fileName: file.name.replace(/\.\w+$/, '') + '.jpg',
  };
}
