/**
 * Normalize client image payloads to raw base64 (smaller DB + consistent length checks).
 */
function normalizeImageData(data) {
  const trimmed = String(data || '').trim();
  if (!trimmed) return '';

  const match = trimmed.match(/^data:image\/[^;]+;base64,(.+)$/i);
  return match ? match[1] : trimmed;
}

module.exports = {
  normalizeImageData,
};
