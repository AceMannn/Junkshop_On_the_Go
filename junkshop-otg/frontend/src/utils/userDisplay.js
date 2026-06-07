/**
 * Two-letter initials from first + last name (e.g. Ace + Marco → "AM").
 * Falls back to first two letters of first name, or "U" if missing.
 */
export function getUserInitials(user) {
  const first = user?.firstName?.trim() || "";
  const last = user?.lastName?.trim() || "";

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  if (first.length >= 2) {
    return first.slice(0, 2).toUpperCase();
  }

  if (first.length === 1) {
    return first.toUpperCase();
  }

  return "U";
}

export function getUserFullName(user) {
  if (!user) return "";
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}
