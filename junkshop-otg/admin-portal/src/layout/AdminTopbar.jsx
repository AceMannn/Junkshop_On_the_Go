import logoImage from '@shared-assets/junkshop-logo.png';

export default function AdminTopbar({ user, onLogout }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoImage}
            alt="JunkShop On-The-Go"
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#191c1c] truncate">JunkShop Admin</p>
            <p className="text-xs text-zinc-500 truncate">Platform operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-[#191c1c]">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-[#42493e] hover:bg-zinc-50 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
