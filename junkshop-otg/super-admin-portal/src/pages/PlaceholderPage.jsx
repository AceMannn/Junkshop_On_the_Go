import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { superCardClass, superPageTitleClass } from '../utils/superAdminUi';

export default function PlaceholderPage({ title, description, phase = 'next phase' }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={superPageTitleClass}>{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      <div className={`${superCardClass} flex flex-col items-center px-6 py-16 text-center`}>
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Construction size={28} />
        </span>
        <p className="text-base font-semibold text-[#191c1c]">Coming in {phase}</p>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          This section will be built with full backend integration. The layout and navigation are
          ready.
        </p>
        <Link
          to="/overview"
          className="mt-6 text-sm font-semibold text-[#006c49] transition-colors hover:text-[#005236]"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
