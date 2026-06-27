/**
 * Returns a shortened version of an address for compact display.
 * Uses the first comma-delimited segment, truncated to maxLen chars.
 */
export function shortLocation(address, maxLen = 60) {
  if (!address) return '';
  const first = String(address).split(',')[0].trim();
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen - 1) + '…';
}
