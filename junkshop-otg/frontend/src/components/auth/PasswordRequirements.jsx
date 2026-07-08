import { CheckCircle2, Circle } from 'lucide-react';

const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 10 characters',
    test: (value) => String(value || '').length >= 10,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    test: (value) => /[A-Z]/.test(String(value || '')),
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    test: (value) => /[a-z]/.test(String(value || '')),
  },
  {
    id: 'number',
    label: 'At least one number',
    test: (value) => /\d/.test(String(value || '')),
  },
  {
    id: 'special',
    label: 'At least one special character',
    test: (value) => /[^A-Za-z0-9]/.test(String(value || '')),
  },
];

export default function PasswordRequirements({ password, className = '' }) {
  const passedCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;

  return (
    <div
      className={`rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-3.5 py-3 ${className}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
          Password requirements
        </p>
        <span className="text-[11px] font-semibold text-emerald-700/80 tabular-nums">
          {passedCount}/{PASSWORD_RULES.length}
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          const Icon = passed ? CheckCircle2 : Circle;
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-xs leading-snug ${
                passed ? 'text-emerald-700' : 'text-charcoal/50'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
