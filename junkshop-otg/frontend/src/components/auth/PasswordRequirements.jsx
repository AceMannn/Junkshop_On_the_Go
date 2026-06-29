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
  return (
    <div className={`rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
        Password rules
      </p>
      <ul className="mt-2 space-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          const Icon = passed ? CheckCircle2 : Circle;
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-xs ${
                passed ? 'text-emerald-700' : 'text-charcoal/55'
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
