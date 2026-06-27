const { v2: cloudinary } = require('cloudinary');

const ROOT_FOLDER = 'junkshop-otg';

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (!isConfigured()) return false;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return true;
}

function toDataUri(data, mimeType = 'image/jpeg') {
  const raw = String(data || '').trim();
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  return `data:${mimeType || 'image/jpeg'};base64,${raw}`;
}

async function uploadImageData(data, { folder, mimeType, publicId, tags = [] } = {}) {
  if (!data) return null;
  if (!configureCloudinary()) return null;

  const upload = await cloudinary.uploader.upload(toDataUri(data, mimeType), {
    folder: `${ROOT_FOLDER}/${folder || 'uploads'}`,
    public_id: publicId,
    resource_type: 'image',
    overwrite: true,
    tags: ['junkshop-otg', ...tags],
  });

  return {
    secureUrl: upload.secure_url,
    publicId: upload.public_id,
    width: upload.width,
    height: upload.height,
    bytes: upload.bytes,
    format: upload.format,
  };
}

module.exports = {
  uploadImageData,
  isCloudinaryConfigured: isConfigured,
};
