import { useState } from "react";
import {
    LayoutDashboard,
    History,
    Heart,
    Settings,
    Search,
    Bell,
    HelpCircle,
    Map,
    Store,
    TrendingUp,
    DollarSign,
    BookOpen,
    Leaf,
    Recycle,
    TreePine,
    Star,
    MapPin,
    Navigation,
    Info,
    ReceiptText,
    Download,
    CalendarDays,
    Filter,
    User,
    Lock,
    Shield,
    Trash2,
    CheckCircle,
    Plus,
    LogOut,
} from "lucide-react";

const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "history", label: "History", icon: History },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "settings", label: "Settings", icon: Settings },
];

const nearbyShops = [
    {
        id: 1,
        name: "Green Earth Recycling",
        distance: "1.2 km away",
        location: "Downtown",
        rating: 4.8,
        reviews: 124,
        status: "Open",
        materials: ["Plastic", "Metal", "Paper"],
        image:
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1000&auto=format&fit=crop",
        favorite: true,
    },
    {
        id: 2,
        name: "Metro Metal Reclaim",
        distance: "2.8 km away",
        location: "West Side",
        rating: 4.5,
        reviews: 98,
        status: "Open",
        materials: ["Metal", "Glass"],
        image:
            "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1000&auto=format&fit=crop",
        favorite: false,
    },
];

const historyRows = [
    {
        id: 1,
        date: "Oct 24, 2023",
        material: "Plastic (PET)",
        weight: "12.5 kg",
        amount: "₱18.75",
        shop: "Green Earth Recycling",
        status: "Completed",
    },
    {
        id: 2,
        date: "Oct 22, 2023",
        material: "Aluminium Cans",
        weight: "4.2 kg",
        amount: "₱12.60",
        shop: "Metro Waste Solutions",
        status: "Processing",
    },
    {
        id: 3,
        date: "Oct 18, 2023",
        material: "Mixed Paper",
        weight: "45.0 kg",
        amount: "₱9.00",
        shop: "Central Hub Disposal",
        status: "Completed",
    },
];

const recentActivities = [
    {
        id: 1,
        material: "PET Bottles",
        date: "Oct 24, 2023",
        shop: "Green Earth",
        amount: "+₱12.50",
        weight: "5.2 kg",
        icon: Recycle,
    },
    {
        id: 2,
        material: "Aluminum Cans",
        date: "Oct 21, 2023",
        shop: "Metro Metal",
        amount: "+₱45.00",
        weight: "12.0 kg",
        icon: Store,
    },
    {
        id: 3,
        material: "Mixed Paper",
        date: "Oct 18, 2023",
        shop: "Green Earth",
        amount: "+₱8.20",
        weight: "15.5 kg",
        icon: ReceiptText,
    },
];

const favoriteShops = [
    {
        id: 1,
        name: "GreenEarth Hub",
        visits: "12 visits this month",
        distance: "1.2 km away",
        rating: 4.9,
        image:
            "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 2,
        name: "Metro Metal Works",
        visits: "5 visits this month",
        distance: "3.8 km away",
        rating: 4.7,
        image:
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1000&auto=format&fit=crop",
    },
];

export default function CustomerDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showToast, setShowToast] = useState(false);

    const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Overview";

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans">
            <Topbar />

            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={onLogout}
            />

            <main className="lg:pl-64 pt-16 min-h-screen">
                <div className="max-w-7xl mx-auto px-5 md:px-10 py-8">
                    {activeTab === "overview" && <OverviewTab />}
                    {activeTab === "history" && <HistoryTab />}
                    {activeTab === "favorites" && <FavoritesTab />}
                    {activeTab === "settings" && (
                        <SettingsTab
                            showToast={showToast}
                            setShowToast={setShowToast}
                        />
                    )}
                </div>
            </main>

            <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "overview" && (
                <button className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-[#154212] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40">
                    <Plus size={28} />
                </button>
            )}
        </div>
    );
}

function Topbar() {
    const user = {
        name: "User",
        avatar: null,
    };

    return (
        <header className="bg-white/90 backdrop-blur-md fixed top-0 w-full z-40 border-b border-zinc-200 shadow-sm flex justify-between items-center px-6 h-16">
            <div className="text-xl font-bold tracking-tight text-emerald-900">
                EcoCycle
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center bg-[#edeeed] rounded-full px-4 py-2 border border-[#c2c9bb]">
                    <Search size={18} className="text-[#42493e] mr-2" />
                    <input
                        className="bg-transparent border-none outline-none text-sm w-56"
                        placeholder="Search facilities..."
                        type="text"
                    />
                </div>

                <button className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
                    <Bell size={20} className="text-emerald-900" />
                </button>

                <button className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
                    <HelpCircle size={20} className="text-emerald-900" />
                </button>

                <img
                    alt="User profile avatar"
                    className="w-8 h-8 rounded-full border border-emerald-200 object-cover"
                    src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=154212&color=fff`
                    }
                />
            </div>
        </header>
    );
}

function Sidebar({ activeTab, setActiveTab, onLogout }) {
    return (
        <aside className="fixed left-0 top-0 h-full w-64 pt-20 border-r border-zinc-200 bg-zinc-50 hidden lg:flex flex-col gap-2 p-4 z-30">
            <div className="px-4 mb-6">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
                    Welcome Back
                </p>
                <p className="text-emerald-700 font-semibold">Eco Warrior Level 4</p>
            </div>

            <nav className="flex flex-col gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 text-left ${isActive
                                ? "text-emerald-700 bg-emerald-50 border-r-4 border-emerald-600"
                                : "text-zinc-600 hover:bg-zinc-100 rounded-lg"
                                }`}
                        >
                            <Icon size={22} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-3">
                <button className="w-full bg-[#154212] text-white py-3 rounded-xl font-semibold hover:bg-emerald-900 transition-colors shadow-lg">
                    Find a Shop
                </button>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 text-red-600 py-2 rounded-xl font-medium hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                )}
            </div>
        </aside>
    );
}

function MobileNav({ activeTab, setActiveTab }) {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-white border-t border-zinc-200 shadow-[0_-4px_12px_rgba(141,170,145,0.15)] z-50 rounded-t-2xl">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-90 transition-transform ${isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-zinc-500 hover:text-emerald-600"
                            }`}
                    >
                        <Icon size={22} />
                        <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

function OverviewTab() {
    return (
        <div className="space-y-10">
            {/* Page Header */}
            <section>
                <h1 className="text-4xl font-bold tracking-tight text-[#191c1c]">
                    Welcome back, Eco-Warrior!
                </h1>
                <p className="mt-2 text-lg text-[#72796e]">
                    Ready to recycle today?
                </p>
            </section>

            {/* Primary Action Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActionCard
                    title="Find Nearby Junkshops"
                    subtitle="Locate recycling centers near you"
                    icon={Map}
                    bg="bg-[#2d5a27]"
                    text="text-white"
                    iconBg="bg-[#154212]/30"
                    largeIcon={MapPin}
                />

                <ActionCard
                    title="View Material Prices"
                    subtitle="Check current market rates"
                    icon={DollarSign}
                    bg="bg-[#c9e7cc]"
                    text="text-[#062010]"
                    iconBg="bg-[#4a654f]/20"
                    largeIcon={TrendingUp}
                />

                <ActionCard
                    title="Open Recycling Guide"
                    subtitle="Learn how to sort materials"
                    icon={BookOpen}
                    bg="bg-[#e1e3e2]"
                    text="text-[#191c1c]"
                    iconBg="bg-[#2e3d34]/10"
                    largeIcon={Leaf}
                />
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Recycled"
                    value="124.5"
                    unit="kg"
                    helper="Based on your confirmed drop-offs this month"
                />

                <StatCard
                    label="Total Earnings"
                    value="₱342.20"
                    helper="Total cash rewards received from transactions"
                />

                <StatCard
                    label="Transactions"
                    value="18"
                    helper="Total number of recycling trips made"
                />

                <StatCard
                    label="Trees Saved"
                    value="12"
                    icon={TreePine}
                    helper="Environmental impact equivalence in tree conservation"
                />
            </section>

            {/* Nearby + Recent */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Nearby Junkshops */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#191c1c]">
                            Nearby Junkshops
                        </h2>

                        <button className="text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
                            View All <Navigation size={18} />
                        </button>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {nearbyShops.map((shop) => (
                            <NearbyShopCard key={shop.id} shop={shop} />
                        ))}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#191c1c]">
                        Recent Activities
                    </h2>

                    <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)] divide-y divide-zinc-100">
                        {recentActivities.map((activity) => {
                            const Icon = activity.icon;

                            return (
                                <button
                                    key={activity.id}
                                    className="w-full p-4 hover:bg-zinc-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 p-3 rounded-lg">
                                            <Icon size={22} className="text-emerald-700" />
                                        </div>

                                        <div className="flex-1">
                                            <h5 className="font-bold text-[#191c1c]">
                                                {activity.material}
                                            </h5>
                                            <p className="text-xs text-[#72796e]">
                                                {activity.date} • {activity.shop}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-emerald-700">
                                                {activity.amount}
                                            </p>
                                            <p className="text-xs text-[#72796e]">
                                                {activity.weight}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button className="w-full text-center py-2 text-sm text-[#72796e] font-medium hover:text-emerald-700 transition-colors">
                        View Full History
                    </button>
                </div>
            </section>
        </div>
    );
}

function ActionCard({
    title,
    subtitle,
    icon: Icon,
    bg,
    text,
    iconBg,
    largeIcon: LargeIcon,
}) {
    return (
        <button
            type="button"
            className={`group relative overflow-hidden ${bg} ${text} p-6 rounded-2xl flex flex-col justify-between h-48 cursor-pointer shadow-[0_4px_12px_rgba(141,170,145,0.15)] hover:shadow-lg transition-all text-left`}
        >
            <div className="flex justify-between items-start">
                <div className={`${iconBg} p-3 rounded-lg`}>
                    <Icon size={32} />
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold leading-tight">
                    {title}
                </h3>
                <p className="text-sm opacity-80 mt-1">
                    {subtitle}
                </p>
            </div>

            <div className="absolute -right-5 -bottom-5 opacity-10 group-hover:scale-110 transition-transform">
                <LargeIcon size={120} />
            </div>
        </button>
    );
}

function StatCard({ label, value, unit, icon: Icon, helper }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)]">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#72796e] uppercase tracking-wider font-semibold">
                    {label}
                </p>

                <Info
                    size={20}
                    className="text-emerald-600 cursor-help"
                >
                    <title>{helper}</title>
                </Info>
            </div>

            <p className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
                {value}
                {unit && <span className="text-sm font-semibold">{unit}</span>}
                {Icon && <Icon size={24} className="text-emerald-500" />}
            </p>
        </div>
    );
}

function NearbyShopCard({ shop }) {
    return (
        <div className="min-w-[320px] bg-white rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)] overflow-hidden flex-shrink-0 group">
            <div className="h-36 bg-zinc-200 overflow-hidden relative">
                <img
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={shop.image}
                />

                <div className="absolute top-3 right-3">
                    <button
                        type="button"
                        className={`bg-white/90 p-2 rounded-full active:scale-90 transition-transform ${shop.favorite ? "text-red-600" : "text-zinc-400"
                            }`}
                    >
                        <Heart
                            size={18}
                            fill={shop.favorite ? "currentColor" : "none"}
                        />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div>
                        <h4 className="font-bold text-[#191c1c]">
                            {shop.name}
                        </h4>
                        <p className="text-xs text-[#72796e]">
                            {shop.distance} • {shop.location}
                        </p>
                    </div>

                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                        {shop.status}
                    </span>
                </div>

                <div className="flex items-center gap-1 text-emerald-600">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-bold">{shop.rating}</span>
                    <span className="text-xs text-[#72796e]">
                        ({shop.reviews} reviews)
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {shop.materials.map((material) => (
                        <span
                            key={material}
                            className="bg-[#c9e7cc] text-[#4e6953] px-2 py-1 rounded-md text-[10px] font-medium"
                        >
                            {material}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 border border-[#154212] text-[#154212] rounded-lg text-sm font-bold hover:bg-[#154212] hover:text-white transition-colors">
                        View Details
                    </button>

                    <button className="py-2 border border-zinc-300 text-[#154212] rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors">
                        Route
                    </button>
                </div>
            </div>
        </div>
    );
}

function HistoryTab() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#191c1c]">
                    Recycling History
                </h1>
                <p className="text-[#72796e] mt-2">
                    Track all your recycling transactions and earnings.
                </p>
            </div>

            {/* Filters + Actions */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="flex items-center bg-white border border-zinc-200 px-3 py-2 rounded-lg">
                        <Search size={18} className="text-[#72796e] mr-2" />
                        <input
                            className="outline-none text-sm"
                            placeholder="Search materials or shops..."
                        />
                    </div>

                    {/* Date */}
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm">
                        <CalendarDays size={16} />
                        Date
                    </button>

                    {/* Filter */}
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                {/* Export */}
                <button className="flex items-center gap-2 bg-[#154212] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <p className="text-xs text-[#72796e]">Total Earnings</p>
                    <h3 className="text-xl font-bold text-emerald-700">₱342.20</h3>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <p className="text-xs text-[#72796e]">Total Weight</p>
                    <h3 className="text-xl font-bold text-emerald-700">124.5 kg</h3>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <p className="text-xs text-[#72796e]">Transactions</p>
                    <h3 className="text-xl font-bold text-emerald-700">18</h3>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-[#f3f4f3] text-[#42493e]">
                        <tr>
                            <th className="text-left p-4">Date</th>
                            <th className="text-left p-4">Material</th>
                            <th className="text-left p-4">Weight</th>
                            <th className="text-left p-4">Amount</th>
                            <th className="text-left p-4">Shop</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-right p-4">Action</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {historyRows.map((row) => (
                            <tr key={row.id} className="hover:bg-zinc-50">
                                <td className="p-4">{row.date}</td>
                                <td className="p-4 font-medium">{row.material}</td>
                                <td className="p-4">{row.weight}</td>
                                <td className="p-4 text-emerald-700 font-semibold">
                                    {row.amount}
                                </td>
                                <td className="p-4">{row.shop}</td>

                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === "Completed"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-yellow-100 text-yellow-700"
                                            }`}
                                    >
                                        {row.status}
                                    </span>
                                </td>

                                <td className="p-4 text-right">
                                    <button className="text-[#154212] hover:underline text-sm">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State (future safe) */}
            {historyRows.length === 0 && (
                <div className="text-center py-16 text-[#72796e]">
                    No transactions yet. Start recycling to see your history.
                </div>
            )}
        </div>
    );
}

function FavoritesTab() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-[#191c1c]">
                        Favorite Shops
                    </h1>
                    <p className="text-[#42493e] mt-2 max-w-md">
                        Access your most visited recycling centers and junkshops to manage
                        your sustainability routine.
                    </p>
                </div>

                <button className="flex items-center justify-center gap-2 bg-[#154212] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95">
                    <Map size={20} />
                    Find New Centers
                </button>
            </div>

            {/* Favorite Shop Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {favoriteShops.map((shop) => (
                    <FavoriteShopCard key={shop.id} shop={shop} />
                ))}

                {/* Explore Map Empty/CTA Card */}
                <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        <Search size={42} className="text-emerald-600" />
                    </div>

                    <h3 className="text-2xl font-bold text-[#154212] mb-2">
                        Explore the Map
                    </h3>

                    <p className="text-[#42493e] text-sm max-w-[240px] mb-6">
                        You haven&apos;t saved any shops yet. Explore the map to find your
                        favorites!
                    </p>

                    <button className="text-emerald-700 font-semibold hover:underline">
                        Browse nearby centers
                    </button>
                </div>
            </div>
        </div>
    );
}

function FavoriteShopCard({ shop }) {
    return (
        <div className="bg-white border border-[#c2c9bb] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(141,170,145,0.15)] flex flex-col group">
            <div className="relative h-40">
                <img
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={shop.image}
                />

                <button className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2 rounded-full text-red-600 transition-transform hover:scale-110 active:scale-90">
                    <Heart size={18} fill="currentColor" />
                </button>
            </div>

            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-[#154212]">{shop.name}</h3>

                    <div className="flex items-center gap-1 text-[#4e6953] bg-[#c9e7cc] px-2 py-0.5 rounded-full text-xs font-semibold">
                        <Star size={13} fill="currentColor" />
                        {shop.rating}
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-[#42493e] text-sm">
                        <Recycle size={16} />
                        {shop.visits}
                    </div>

                    <div className="flex items-center gap-2 text-[#42493e] text-sm">
                        <MapPin size={16} />
                        {shop.distance}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-1 py-2 px-3 border border-[#c2c9bb] rounded-lg text-sm font-semibold hover:bg-[#edeeed] transition-colors">
                        <Info size={15} />
                        Details
                    </button>

                    <button className="flex items-center justify-center gap-1 py-2 px-3 border border-[#c2c9bb] rounded-lg text-sm font-semibold hover:bg-[#edeeed] transition-colors">
                        <Navigation size={15} />
                        Route
                    </button>

                    <button className="col-span-2 flex items-center justify-center gap-1 py-2 px-3 bg-[#4a654f] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                        <DollarSign size={15} />
                        View Prices
                    </button>
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ showToast, setShowToast }) {
    const handleSave = (e) => {
        e.preventDefault();
        setShowToast(true);

        setTimeout(() => {
            setShowToast(false);
        }, 2500);
    };

    return (
        <div className="space-y-10">
            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl shadow-[0_10px_25px_rgba(141,170,145,0.2)]">
                    <CheckCircle size={22} className="text-emerald-600" />
                    <p className="font-semibold">Profile updated successfully</p>
                </div>
            )}

            {/* Page Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#154212] mb-2">
                    Account Settings
                </h1>
                <p className="text-[#42493e]">
                    Manage your personal information and security preferences.
                </p>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="xl:col-span-7 space-y-8">
                    {/* Personal Info */}
                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-[#c9e7cc] flex items-center justify-center">
                                <User size={22} className="text-[#4e6953]" />
                            </div>

                            <h2 className="text-2xl font-bold">Personal Info</h2>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Full Name" required defaultValue="Alex Henderson" />
                                <InputField
                                    label="Email Address"
                                    required
                                    type="email"
                                    defaultValue="alex.h@ecocycle.com"
                                />
                                <InputField
                                    label="Phone Number"
                                    type="tel"
                                    defaultValue="+63 912 345 6789"
                                />
                                <InputField label="Postal Code" defaultValue="1016" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-[#42493e]">
                                    Street Address
                                </label>
                                <textarea
                                    className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154212] focus:border-transparent outline-none transition-all resize-none"
                                    rows="3"
                                    defaultValue="Teresa, Sta. Mesa, Manila"
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    className="bg-[#154212] text-white px-8 py-3 rounded-full font-semibold shadow-md hover:bg-emerald-900 transition-all active:scale-95"
                                    type="submit"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Impact Banner */}
                    <div className="relative overflow-hidden bg-[#2d5a27] rounded-3xl p-8 text-[#9dd090] h-48 flex flex-col justify-end">
                        <img
                            alt="Green landscape"
                            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
                            src="https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop"
                        />

                        <div className="relative z-10">
                            <span className="text-xs uppercase tracking-wider opacity-80 font-semibold">
                                Sustainability Impact
                            </span>

                            <h3 className="text-2xl font-bold">
                                1,240 lbs of CO₂ Saved
                            </h3>

                            <p className="text-sm opacity-90">
                                Keep going! You&apos;re in the top 5% of recyclers this month.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="xl:col-span-5 space-y-8">
                    {/* Security */}
                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#c9e7cc] flex items-center justify-center">
                                <Lock size={22} className="text-[#4e6953]" />
                            </div>

                            <h2 className="text-2xl font-bold">Security</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold mb-4">Change Password</h3>

                                <div className="space-y-4">
                                    <input
                                        className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154212] outline-none"
                                        placeholder="Current Password"
                                        type="password"
                                    />

                                    <input
                                        className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154212] outline-none"
                                        placeholder="New Password"
                                        type="password"
                                    />

                                    <button className="w-full py-3 border-2 border-[#154212] text-[#154212] rounded-xl font-semibold hover:bg-emerald-50 transition-colors">
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-zinc-100 my-8" />

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold">Two-Factor Authentication</h3>
                                    <p className="text-sm text-[#42493e]">
                                        Add an extra layer of security to your account.
                                    </p>
                                </div>

                                <button className="w-12 h-6 bg-[#154212] rounded-full relative flex items-center px-1 transition-all">
                                    <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Privacy */}
                    <section className="bg-[#45544a] p-6 rounded-3xl text-[#b6c7bb] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                <Shield size={22} />
                            </div>

                            <div>
                                <h4 className="font-semibold">Privacy Preference</h4>
                                <p className="text-sm opacity-80">Public profile is visible</p>
                            </div>
                        </div>

                        <button className="text-sm font-bold underline">Edit</button>
                    </section>

                    {/* Deactivate */}
                    <div className="p-4 flex items-center justify-center">
                        <button className="text-red-600 font-semibold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                            <Trash2 size={20} />
                            Deactivate Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, required, type = "text", defaultValue }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#42493e]">
                {label} {required && <span className="text-red-600">*</span>}
            </label>

            <input
                className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154212] focus:border-transparent outline-none transition-all"
                type={type}
                defaultValue={defaultValue}
            />
        </div>
    );
}