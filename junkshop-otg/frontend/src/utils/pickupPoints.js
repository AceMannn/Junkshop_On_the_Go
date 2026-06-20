export const POINTS_PER_KG = 100;

export function estimateDropOffPoints(weightKg) {
    const weight = Number(weightKg);
    if (!Number.isFinite(weight) || weight <= 0) return 0;
    return Math.round(weight * POINTS_PER_KG);
}

export function formatPoints(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString();
}

export function getPaymentCooldownMinutes(cooldownUntil) {
    if (!cooldownUntil) return 0;
    const ms = new Date(cooldownUntil).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / 60000);
}

export function getPaymentAttemptsLeft(submitCount, maxAttempts = 5) {
    const count = Number(submitCount) || 0;
    return Math.max(0, maxAttempts - count);
}
