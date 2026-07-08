export default function CharCount({ value, max, min = 0, className = '' }) {
  const length = String(value || '').length;
  const nearLimit = max > 0 && length >= max * 0.9;
  const atLimit = max > 0 && length >= max;
  const belowMin = min > 0 && length > 0 && length < min;

  let tone = 'text-[#72796e]';
  if (atLimit || belowMin) tone = 'text-red-600 font-medium';
  else if (nearLimit) tone = 'text-amber-700';

  return (
    <p className={`mt-1 text-right text-xs ${tone} ${className}`.trim()}>
      {length} / {max}
      {min > 0 && length > 0 && length < min ? ` · at least ${min} characters` : ''}
    </p>
  );
}
