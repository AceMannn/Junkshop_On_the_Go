import { useState } from "react";
import {
    LayoutDashboard,
    Package,
    DollarSign,
    Clock,
    Truck,
    ReceiptText,
    Edit2,
    MapPin,
    CheckCircle,
    XCircle,
    Shield,
    Monitor,
    Save,
    Image,
    KeyRound,
    Eye,
    Clock3,
    Trash2,
    MoreVertical,
    Power,
    PowerOff,
    X,
    Filter,
    Settings,
    LogOut,
    Search,
    Bell,
    HelpCircle,
    User,
    ChevronDown,
    Plus,
    Store,
} from "lucide-react";

const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "materials", label: "Materials", icon: Package },
    { id: "prices", label: "Prices", icon: DollarSign },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "requests", label: "Pickup Requests", icon: Truck },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
    { id: "settings", label: "Settings", icon: Settings },
];

const searchPlaceholders = {
    dashboard: "Search dashboard...",
    materials: "Search materials...",
    prices: "Search prices...",
    availability: "Search availability...",
    requests: "Search pickup requests...",
    transactions: "Search transactions...",
    settings: "Search settings...",
};

export default function ProviderDashboard({ onLogout, materials = [], onUpdateMaterials }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleNavigate = (tabId) => {
        setActiveTab(tabId);
        setShowNotifications(false);
        setShowProfileMenu(false);
    };

    const activeTitle = tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard";

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans">
            <Sidebar
                activeTab={activeTab}
                onNavigate={handleNavigate}
                onLogout={onLogout}
            />

            <Topbar
                activeTitle={activeTitle}
                activeTab={activeTab}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                onLogout={onLogout}
            />

            <main className="lg:pl-72 pt-20 min-h-screen">
                <div className="max-w-7xl mx-auto px-5 md:px-8 py-8">
                    {activeTab === "dashboard" && <DashboardTab />}
                    {activeTab === "materials" && (
                        <MaterialsTab
                            materials={materials}
                            onUpdateMaterials={onUpdateMaterials}
                        />
                    )}
                    {activeTab === "prices" && <PricesTab />}
                    {activeTab === "availability" && <AvailabilityTab />}
                    {activeTab === "requests" && <PickupRequestsTab />}
                    {activeTab === "transactions" && <TransactionsTab />}
                    {activeTab === "settings" && <SettingsTab />}
                </div>
            </main>

            {(activeTab === "dashboard" || activeTab === "materials") && (
                <button className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#154212] text-white shadow-xl transition hover:scale-105 active:scale-95">
                    <Plus size={28} />
                </button>
            )}
        </div>
    );
}

function Sidebar({ activeTab, onNavigate, onLogout }) {
    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-full w-72 flex-col border-r border-zinc-200 bg-white lg:flex">
            <div className="border-b border-zinc-200 bg-[#154212] p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                        <Store size={24} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold leading-tight">JunkShop</h2>
                        <p className="text-xs text-white/80">Provider Dashboard</p>
                    </div>
                </div>

                <div className="mt-5 rounded-xl bg-white/10 p-3">
                    <p className="text-xs font-semibold text-white/80">Shop Location</p>
                    <p className="text-sm font-medium">Teresa, Sta. Mesa</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onNavigate(tab.id)}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${isActive
                                ? "bg-[#c9e7cc] text-[#154212]"
                                : "text-[#72796e] hover:bg-[#f3f4f3] hover:text-[#191c1c]"
                                }`}
                        >
                            <Icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="border-t border-zinc-200 p-4">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
}

function Topbar({
    activeTitle,
    activeTab,
    showNotifications,
    setShowNotifications,
    showProfileMenu,
    setShowProfileMenu,
    onLogout,
}) {
    return (
        <header className="fixed left-0 right-0 top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md lg:left-72">
            <div className="flex h-20 items-center justify-between px-5 md:px-8">
                <div>
                    <h1 className="text-xl font-bold text-[#154212]">{activeTitle}</h1>
                    <p className="text-sm text-[#72796e]">
                        Manage your junkshop operations efficiently.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden items-center rounded-full border border-[#c2c9bb] bg-[#f3f4f3] px-4 py-2 md:flex">
                        <Search size={18} className="mr-2 text-[#72796e]" />
                        <input
                            className="w-56 bg-transparent text-sm outline-none"
                            placeholder={searchPlaceholders[activeTab]}
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications((value) => !value);
                                setShowProfileMenu(false);
                            }}
                            className="relative rounded-full p-2 text-[#154212] transition hover:bg-[#f3f4f3]"
                        >
                            <Bell size={21} />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                        </button>

                        {showNotifications && <NotificationDropdown />}
                    </div>

                    <button className="rounded-full p-2 text-[#154212] transition hover:bg-[#f3f4f3]">
                        <HelpCircle size={21} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProfileMenu((value) => !value);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-2 rounded-full border border-[#c2c9bb] bg-white px-2 py-1.5 transition hover:bg-[#f3f4f3]"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#154212] text-sm font-bold text-white">
                                P
                            </div>
                            <span className="hidden text-sm font-semibold text-[#191c1c] md:inline">
                                Provider
                            </span>
                            <ChevronDown size={16} className="text-[#72796e]" />
                        </button>

                        {showProfileMenu && <ProfileDropdown onLogout={onLogout} />}
                    </div>
                </div>
            </div>
        </header>
    );
}

function NotificationDropdown() {
    const notifications = [
        { id: 1, title: "New pickup request received", time: "2 min ago" },
        { id: 2, title: "Price updated successfully", time: "1 hour ago" },
        { id: 3, title: "Transaction completed", time: "Today" },
    ];

    return (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-[#191c1c]">Notifications</h3>
                <span className="rounded-full bg-[#c9e7cc] px-2 py-1 text-xs font-semibold text-[#154212]">
                    3 new
                </span>
            </div>

            <div className="space-y-2">
                {notifications.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-xl bg-[#f9f9f8] p-3 transition hover:bg-[#f3f4f3]"
                    >
                        <p className="text-sm font-semibold text-[#191c1c]">{item.title}</p>
                        <p className="text-xs text-[#72796e]">{item.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfileDropdown({ onLogout }) {
    return (
        <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]">
                <User size={18} />
                My Profile
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]">
                <Settings size={18} />
                Security Settings
            </button>

            <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            >
                <LogOut size={18} />
                Logout
            </button>
        </div>
    );
}

/* TEMPORARY PLACEHOLDERS — replaced in next parts */

function DashboardTab() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <section>
                <h1 className="text-3xl font-bold text-[#154212]">
                    Dashboard Overview
                </h1>
                <p className="text-[#72796e] mt-2">
                    Monitor your junkshop performance and recent activities.
                </p>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard title="Total Materials" value="1,250" unit="kg" />
                <StatCard title="Active Listings" value="24" unit="items" />
                <StatCard title="Average Price" value="₱18.50" unit="/kg" />
                <StatCard title="Views Today" value="124" unit="visits" />
            </section>

            {/* Middle Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <h2 className="text-lg font-bold text-[#191c1c] mb-4">
                        Recent Activity
                    </h2>

                    <div className="space-y-4">
                        {[
                            "Updated plastic price",
                            "Accepted pickup request",
                            "Marked request as completed",
                            "Added new material",
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="flex justify-between text-sm text-[#42493e]"
                            >
                                <span>{item}</span>
                                <span className="text-[#72796e]">Just now</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Materials */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <h2 className="text-lg font-bold text-[#191c1c] mb-4">
                        Top Materials
                    </h2>

                    <div className="space-y-4">
                        {[
                            { name: "Plastic Bottles", price: "₱20/kg" },
                            { name: "Aluminum", price: "₱50/kg" },
                            { name: "Cardboard", price: "₱10/kg" },
                        ].map((mat, index) => (
                            <div
                                key={index}
                                className="flex justify-between text-sm text-[#42493e]"
                            >
                                <span>{mat.name}</span>
                                <span className="font-semibold text-[#154212]">
                                    {mat.price}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="text-lg font-bold text-[#191c1c] mb-4">
                    Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionCard title="Add Material" />
                    <ActionCard title="Update Prices" />
                    <ActionCard title="Manage Availability" />
                </div>
            </section>
        </div>
    );
}

function StatCard({ title, value, unit }) {
    return (
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <p className="text-sm text-[#72796e]">{title}</p>
            <h3 className="text-2xl font-bold text-[#154212] mt-1">
                {value}
                <span className="text-sm font-medium ml-1">{unit}</span>
            </h3>
        </div>
    );
}

function ActionCard({ title }) {
    return (
        <button className="bg-[#f3f4f3] hover:bg-[#e1e3e2] transition rounded-xl p-4 text-sm font-semibold text-[#154212]">
            {title}
        </button>
    );
}

function MaterialsTab({ materials = [], onUpdateMaterials }) {
    const defaultMaterials = [
        {
            id: "1",
            name: "Plastic Bottles",
            category: "Plastic",
            price: 20,
            unit: "kg",
            available: true,
        },
        {
            id: "2",
            name: "Aluminum Cans",
            category: "Metal",
            price: 50,
            unit: "kg",
            available: true,
        },
        {
            id: "3",
            name: "Cardboard",
            category: "Paper",
            price: 10,
            unit: "kg",
            available: false,
        },
    ];

    const [localMaterials, setLocalMaterials] = useState(
        materials && materials.length > 0 ? materials : defaultMaterials
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "Plastic",
        price: "",
        unit: "kg",
        available: true,
    });

    const currentMaterials =
        materials && materials.length > 0 ? materials : localMaterials;

    const updateMaterials = (updatedMaterials) => {
        if (onUpdateMaterials) {
            onUpdateMaterials(updatedMaterials);
        } else {
            setLocalMaterials(updatedMaterials);
        }
    };

    const filteredMaterials = currentMaterials.filter((material) => {
        const materialName = material.name || "";
        const materialCategory = material.category || "";

        const matchesSearch =
            materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            materialCategory.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            categoryFilter === "All" ||
            materialCategory.toLowerCase() === categoryFilter.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    const resetForm = () => {
        setFormData({
            name: "",
            category: "Plastic",
            price: "",
            unit: "kg",
            available: true,
        });
        setEditingMaterial(null);
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (material) => {
        setEditingMaterial(material);
        setFormData({
            name: material.name,
            category: material.category,
            price: material.price,
            unit: material.unit || "kg",
            available: material.available,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Material name is required.");
            return;
        }

        if (!formData.price || Number(formData.price) <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        if (editingMaterial) {
            const updated = currentMaterials.map((material) =>
                material.id === editingMaterial.id
                    ? {
                        ...material,
                        name: formData.name,
                        category: formData.category,
                        price: Number(formData.price),
                        unit: formData.unit,
                        available: formData.available,
                    }
                    : material
            );

            updateMaterials(updated);
        } else {
            const newMaterial = {
                id: Date.now().toString(),
                name: formData.name,
                category: formData.category,
                price: Number(formData.price),
                unit: formData.unit,
                available: formData.available,
            };

            updateMaterials([...currentMaterials, newMaterial]);
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id) => {
        const confirmed = confirm("Delete this material?");
        if (!confirmed) return;

        updateMaterials(currentMaterials.filter((material) => material.id !== id));
    };

    const toggleAvailability = (id) => {
        const updated = currentMaterials.map((material) =>
            material.id === id
                ? { ...material, available: !material.available }
                : material
        );

        updateMaterials(updated);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#154212]">Materials</h1>
                    <p className="mt-2 text-[#72796e]">
                        Manage recyclable materials, prices, and availability.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
                >
                    <Plus size={18} />
                    Add Material
                </button>
            </section>

            {/* Search + Filter */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full items-center rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 lg:max-w-md">
                        <Search size={18} className="mr-2 text-[#72796e]" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm outline-none"
                            placeholder="Search materials..."
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-[#72796e]" />

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm font-medium text-[#191c1c] outline-none"
                        >
                            <option>All</option>
                            <option>Plastic</option>
                            <option>Metal</option>
                            <option>Paper</option>
                            <option>Glass</option>
                            <option>Electronics</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Materials Table */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-[#f3f4f3] text-[#72796e]">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Material Name</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Price/kg</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100">
                            {filteredMaterials.map((material) => (
                                <tr key={material.id} className="transition hover:bg-[#f9f9f8]">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-[#191c1c]">
                                            {material.name}
                                        </p>
                                        <p className="text-xs text-[#72796e]">
                                            Unit: {material.unit || "kg"}
                                        </p>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-[#c9e7cc] px-3 py-1 text-xs font-semibold text-[#154212]">
                                            {material.category}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 font-bold text-[#154212]">
                                        ₱{material.price}/{material.unit || "kg"}
                                    </td>

                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleAvailability(material.id)}
                                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${material.available
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-zinc-100 text-zinc-500"
                                                }`}
                                        >
                                            {material.available ? (
                                                <>
                                                    <Power size={14} />
                                                    Available
                                                </>
                                            ) : (
                                                <>
                                                    <PowerOff size={14} />
                                                    Unavailable
                                                </>
                                            )}
                                        </button>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(material)}
                                                className="rounded-lg p-2 text-[#154212] transition hover:bg-[#c9e7cc]"
                                                title="Edit material"
                                            >
                                                <Edit2 size={17} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(material.id)}
                                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                title="Delete material"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredMaterials.length === 0 && (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <Package size={48} className="mb-3 text-[#72796e]" />
                            <h3 className="text-lg font-bold text-[#191c1c]">
                                No materials found
                            </h3>
                            <p className="mt-1 text-sm text-[#72796e]">
                                Try changing your search or add a new material.
                            </p>
                            <button
                                onClick={openAddModal}
                                className="mt-5 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white"
                            >
                                Add Material
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {isModalOpen && (
                <MaterialModal
                    editingMaterial={editingMaterial}
                    formData={formData}
                    setFormData={setFormData}
                    onClose={() => {
                        setIsModalOpen(false);
                        resetForm();
                    }}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}

function MaterialModal({
    editingMaterial,
    formData,
    setFormData,
    onClose,
    onSubmit,
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#154212]">
                            {editingMaterial ? "Edit Material" : "Add Material"}
                        </h2>
                        <p className="text-sm text-[#72796e]">
                            Fill in the recyclable material details.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-[#72796e] transition hover:bg-[#f3f4f3]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <FormGroup label="Material Name">
                        <input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                            placeholder="e.g., Plastic Bottles"
                        />
                    </FormGroup>

                    <FormGroup label="Category">
                        <select
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                            className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        >
                            <option>Plastic</option>
                            <option>Metal</option>
                            <option>Paper</option>
                            <option>Glass</option>
                            <option>Electronics</option>
                        </select>
                    </FormGroup>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormGroup label="Price">
                            <input
                                type="number"
                                min="1"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: e.target.value })
                                }
                                className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                                placeholder="0"
                            />
                        </FormGroup>

                        <FormGroup label="Unit">
                            <select
                                value={formData.unit}
                                onChange={(e) =>
                                    setFormData({ ...formData, unit: e.target.value })
                                }
                                className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                            >
                                <option>kg</option>
                                <option>pc</option>
                                <option>sack</option>
                            </select>
                        </FormGroup>
                    </div>

                    <label className="flex items-center justify-between rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3">
                        <span>
                            <p className="text-sm font-semibold text-[#191c1c]">
                                Available to customers
                            </p>
                            <p className="text-xs text-[#72796e]">
                                Customers can see this material in your shop listing.
                            </p>
                        </span>

                        <input
                            type="checkbox"
                            checked={formData.available}
                            onChange={(e) =>
                                setFormData({ ...formData, available: e.target.checked })
                            }
                            className="h-5 w-5 accent-[#154212]"
                        />
                    </label>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-[#c2c9bb] px-5 py-3 text-sm font-semibold text-[#191c1c] transition hover:bg-[#f3f4f3]"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="flex-1 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                    >
                        {editingMaterial ? "Save Changes" : "Add Material"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FormGroup({ label, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#191c1c]">
                {label}
            </label>
            {children}
        </div>
    );
}

function PricesTab() {
    const initialPrices = [
        {
            id: "1",
            material: "Plastic Bottles",
            category: "Plastic",
            currentPrice: 20,
            previousPrice: 18,
            unit: "kg",
            lastUpdated: "Today, 9:30 AM",
        },
        {
            id: "2",
            material: "Aluminum Cans",
            category: "Metal",
            currentPrice: 50,
            previousPrice: 55,
            unit: "kg",
            lastUpdated: "Yesterday, 4:15 PM",
        },
        {
            id: "3",
            material: "Cardboard",
            category: "Paper",
            currentPrice: 10,
            previousPrice: 10,
            unit: "kg",
            lastUpdated: "May 1, 2026",
        },
    ];

    const [prices, setPrices] = useState(initialPrices);
    const [editingId, setEditingId] = useState(null);
    const [draftPrice, setDraftPrice] = useState("");
    const [toast, setToast] = useState("");

    const startEditing = (item) => {
        setEditingId(item.id);
        setDraftPrice(item.currentPrice.toString());
    };

    const discardEdit = () => {
        setEditingId(null);
        setDraftPrice("");
    };

    const savePrice = (id) => {
        if (!draftPrice || Number(draftPrice) <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        const updated = prices.map((item) =>
            item.id === id
                ? {
                    ...item,
                    previousPrice: item.currentPrice,
                    currentPrice: Number(draftPrice),
                    lastUpdated: "Just now",
                }
                : item
        );

        setPrices(updated);
        setEditingId(null);
        setDraftPrice("");
        setToast("Price updated successfully.");

        setTimeout(() => {
            setToast("");
        }, 2500);
    };

    const publishAllChanges = () => {
        setToast("All price changes published successfully.");
        setTimeout(() => {
            setToast("");
        }, 2500);
    };

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className="fixed right-6 top-24 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
                    {toast}
                </div>
            )}

            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#154212]">Prices</h1>
                    <p className="mt-2 text-[#72796e]">
                        Update recyclable material prices and review recent price changes.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button className="rounded-xl border border-[#c2c9bb] bg-white px-5 py-3 text-sm font-semibold text-[#154212] transition hover:bg-[#f3f4f3]">
                        Price History
                    </button>

                    <button
                        onClick={publishAllChanges}
                        className="rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
                    >
                        Publish Changes
                    </button>
                </div>
            </section>

            {/* Summary */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <PriceSummaryCard
                    title="Average Price"
                    value="₱26.67"
                    unit="/kg"
                    helper="Average price across all listed materials"
                />
                <PriceSummaryCard
                    title="Increased Prices"
                    value="1"
                    unit="item"
                    helper="Materials with price increase"
                />
                <PriceSummaryCard
                    title="Updated Today"
                    value="1"
                    unit="item"
                    helper="Changes made today"
                />
            </section>

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-200 bg-[#f3f4f3] px-6 py-4">
                    <h2 className="font-bold text-[#191c1c]">Material Price List</h2>
                    <p className="text-sm text-[#72796e]">
                        Edit prices inline, then publish changes when ready.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-white text-[#72796e]">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Material</th>
                                <th className="px-6 py-4 font-semibold">Current Price</th>
                                <th className="px-6 py-4 font-semibold">Trend</th>
                                <th className="px-6 py-4 font-semibold">Last Updated</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100">
                            {prices.map((item) => {
                                const isEditing = editingId === item.id;
                                const trend = item.currentPrice - item.previousPrice;
                                const trendLabel =
                                    trend > 0 ? `+₱${trend}` : trend < 0 ? `-₱${Math.abs(trend)}` : "No change";

                                return (
                                    <tr key={item.id} className="transition hover:bg-[#f9f9f8]">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[#191c1c]">
                                                {item.material}
                                            </p>
                                            <p className="text-xs text-[#72796e]">{item.category}</p>
                                        </td>

                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-[#72796e]">₱</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={draftPrice}
                                                        onChange={(e) => setDraftPrice(e.target.value)}
                                                        className="w-28 rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                                                    />
                                                    <span className="text-xs text-[#72796e]">
                                                        /{item.unit}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="font-bold text-[#154212]">
                                                    ₱{item.currentPrice}/{item.unit}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${trend > 0
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : trend < 0
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-zinc-100 text-zinc-600"
                                                    }`}
                                            >
                                                {trendLabel}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-[#72796e]">
                                            {item.lastUpdated}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => savePrice(item.id)}
                                                            className="rounded-xl bg-[#154212] px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-900"
                                                        >
                                                            Save
                                                        </button>

                                                        <button
                                                            onClick={discardEdit}
                                                            className="rounded-xl border border-[#c2c9bb] px-4 py-2 text-xs font-semibold text-[#191c1c] transition hover:bg-[#f3f4f3]"
                                                        >
                                                            Discard
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        className="rounded-xl border border-[#c2c9bb] px-4 py-2 text-xs font-semibold text-[#154212] transition hover:bg-[#f3f4f3]"
                                                    >
                                                        Edit Price
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function PriceSummaryCard({ title, value, unit, helper }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-[#72796e]">{title}</p>
            <h3 className="mt-1 text-2xl font-bold text-[#154212]">
                {value}
                <span className="ml-1 text-sm font-medium">{unit}</span>
            </h3>
            <p className="mt-2 text-xs text-[#72796e]">{helper}</p>
        </div>
    );
}

function AvailabilityTab() {
    const [isOpen, setIsOpen] = useState(true);
    const [pickupEnabled, setPickupEnabled] = useState(true);
    const [capacity, setCapacity] = useState(500);
    const [hours, setHours] = useState({
        open: "08:00",
        close: "17:00",
    });

    const [toast, setToast] = useState("");

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    };

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className="fixed right-6 top-24 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
                    {toast}
                </div>
            )}

            {/* Header */}
            <section>
                <h1 className="text-3xl font-bold text-[#154212]">Availability</h1>
                <p className="mt-2 text-[#72796e]">
                    Manage shop status, working hours, and pickup availability.
                </p>
            </section>

            {/* Top Controls */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shop Status */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h2 className="font-bold text-[#191c1c] mb-4">Shop Status</h2>

                    <button
                        onClick={() => {
                            setIsOpen(!isOpen);
                            showToast(`Shop is now ${!isOpen ? "Open" : "Closed"}`);
                        }}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition ${isOpen
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {isOpen ? "Open" : "Closed"}
                    </button>
                </div>

                {/* Pickup Toggle */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h2 className="font-bold text-[#191c1c] mb-4">
                        Pickup Availability
                    </h2>

                    <button
                        onClick={() => {
                            setPickupEnabled(!pickupEnabled);
                            showToast(
                                `Pickup ${!pickupEnabled ? "Enabled" : "Disabled"
                                } successfully`
                            );
                        }}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition ${pickupEnabled
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                            }`}
                    >
                        {pickupEnabled ? "Enabled" : "Disabled"}
                    </button>
                </div>
            </section>

            {/* Working Hours */}
            <section className="bg-white p-6 rounded-2xl border shadow-sm">
                <h2 className="font-bold text-[#191c1c] mb-4">Working Hours</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-semibold text-[#191c1c] block mb-2">
                            Opening Time
                        </label>
                        <input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                                setHours({ ...hours, open: e.target.value })
                            }
                            className="w-full rounded-xl border border-[#c2c9bb] px-4 py-3 bg-[#f9f9f8]"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-[#191c1c] block mb-2">
                            Closing Time
                        </label>
                        <input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                                setHours({ ...hours, close: e.target.value })
                            }
                            className="w-full rounded-xl border border-[#c2c9bb] px-4 py-3 bg-[#f9f9f8]"
                        />
                    </div>
                </div>
            </section>

            {/* Capacity */}
            <section className="bg-white p-6 rounded-2xl border shadow-sm">
                <h2 className="font-bold text-[#191c1c] mb-4">
                    Daily Capacity (kg)
                </h2>

                <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full accent-[#154212]"
                />

                <p className="mt-2 text-sm text-[#72796e]">
                    Current Capacity:{" "}
                    <span className="font-semibold text-[#154212]">
                        {capacity} kg/day
                    </span>
                </p>
            </section>

            {/* Right Panel Style Info */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Load */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h2 className="font-bold text-[#191c1c] mb-4">
                        Current Load
                    </h2>

                    <div className="w-full bg-[#f3f4f3] rounded-full h-4">
                        <div
                            className="bg-[#154212] h-4 rounded-full"
                            style={{ width: "60%" }}
                        />
                    </div>

                    <p className="mt-2 text-sm text-[#72796e]">
                        300kg / {capacity}kg
                    </p>
                </div>

                {/* Upcoming Pickups */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h2 className="font-bold text-[#191c1c] mb-4">
                        Upcoming Pickups
                    </h2>

                    <ul className="space-y-2 text-sm text-[#42493e]">
                        <li>Juan Dela Cruz - 50kg</li>
                        <li>Maria Santos - 30kg</li>
                        <li>Pedro Reyes - 20kg</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

function PickupRequestsTab() {
    const [activeRequestTab, setActiveRequestTab] = useState("All");
    const [toast, setToast] = useState("");

    const [requests, setRequests] = useState([
        {
            id: "REQ-001",
            customer: "Juan Dela Cruz",
            materials: "Plastic Bottles, Cardboard",
            weight: 45,
            location: "Teresa, Sta. Mesa, Manila",
            dateTime: "May 3, 2026 • 9:00 AM",
            status: "Pending",
        },
        {
            id: "REQ-002",
            customer: "Maria Santos",
            materials: "Aluminum Cans",
            weight: 18,
            location: "Old Sta. Mesa, Manila",
            dateTime: "May 3, 2026 • 1:30 PM",
            status: "Accepted",
        },
        {
            id: "REQ-003",
            customer: "Pedro Reyes",
            materials: "Mixed Paper",
            weight: 30,
            location: "Pureza, Manila",
            dateTime: "May 2, 2026 • 4:00 PM",
            status: "In Transit",
        },
        {
            id: "REQ-004",
            customer: "Ana Cruz",
            materials: "Glass Bottles",
            weight: 22,
            location: "Sampaloc, Manila",
            dateTime: "May 1, 2026 • 10:00 AM",
            status: "Completed",
        },
    ]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 2500);
    };

    const updateStatus = (id, newStatus) => {
        setRequests((prevRequests) =>
            prevRequests.map((request) =>
                request.id === id ? { ...request, status: newStatus } : request
            )
        );

        showToast(`Request ${id} updated to ${newStatus}.`);
    };

    const filteredRequests = requests.filter((request) => {
        if (activeRequestTab === "All") return true;
        if (activeRequestTab === "Scheduled") {
            return ["Pending", "Accepted", "In Transit"].includes(request.status);
        }
        if (activeRequestTab === "History") {
            return ["Completed", "Declined"].includes(request.status);
        }
        return true;
    });

    const pendingCount = requests.filter((r) => r.status === "Pending").length;
    const inTransitCount = requests.filter((r) => r.status === "In Transit").length;
    const completedTodayCount = requests.filter((r) => r.status === "Completed").length;
    const totalVolume = requests.reduce((sum, r) => sum + r.weight, 0);

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className="fixed right-6 top-24 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
                    {toast}
                </div>
            )}

            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#154212]">
                        Pickup Requests
                    </h1>
                    <p className="mt-2 text-[#72796e]">
                        Review customer pickup requests and update their status.
                    </p>
                </div>

                <button className="flex items-center justify-center gap-2 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900">
                    <Plus size={18} />
                    Manual Request
                </button>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <RequestStatCard title="Pending" value={pendingCount} unit="requests" />
                <RequestStatCard title="In Transit" value={inTransitCount} unit="requests" />
                <RequestStatCard title="Completed Today" value={completedTodayCount} unit="requests" />
                <RequestStatCard title="Total Volume" value={totalVolume} unit="kg" />
            </section>

            {/* Tabs */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {["All", "Scheduled", "History"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveRequestTab(tab)}
                            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeRequestTab === tab
                                ? "bg-[#154212] text-white"
                                : "text-[#72796e] hover:bg-[#f3f4f3]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </section>

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                        <thead className="bg-[#f3f4f3] text-[#72796e]">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Materials</th>
                                <th className="px-6 py-4 font-semibold">Weight</th>
                                <th className="px-6 py-4 font-semibold">Location</th>
                                <th className="px-6 py-4 font-semibold">Date & Time</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100">
                            {filteredRequests.map((request) => (
                                <tr key={request.id} className="transition hover:bg-[#f9f9f8]">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-[#191c1c]">
                                            {request.customer}
                                        </p>
                                        <p className="text-xs text-[#72796e]">{request.id}</p>
                                    </td>

                                    <td className="px-6 py-4 text-[#42493e]">
                                        {request.materials}
                                    </td>

                                    <td className="px-6 py-4 font-semibold text-[#154212]">
                                        {request.weight} kg
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 text-[#42493e]">
                                            <MapPin size={16} className="mt-0.5 text-[#72796e]" />
                                            <span>{request.location}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-[#42493e]">
                                        {request.dateTime}
                                    </td>

                                    <td className="px-6 py-4">
                                        <StatusBadge status={request.status} />
                                    </td>

                                    <td className="px-6 py-4">
                                        <RequestActions
                                            request={request}
                                            onUpdateStatus={updateStatus}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredRequests.length === 0 && (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <Truck size={48} className="mb-3 text-[#72796e]" />
                            <h3 className="text-lg font-bold text-[#191c1c]">
                                No pickup requests found
                            </h3>
                            <p className="mt-1 text-sm text-[#72796e]">
                                New customer pickup requests will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function RequestStatCard({ title, value, unit }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-[#72796e]">{title}</p>
            <h3 className="mt-1 text-2xl font-bold text-[#154212]">
                {value}
                <span className="ml-1 text-sm font-medium">{unit}</span>
            </h3>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        Pending: "bg-yellow-100 text-yellow-800",
        Accepted: "bg-blue-100 text-blue-800",
        "In Transit": "bg-indigo-100 text-indigo-800",
        Completed: "bg-emerald-100 text-emerald-800",
        Declined: "bg-red-100 text-red-800",
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] || "bg-zinc-100 text-zinc-700"
                }`}
        >
            {status}
        </span>
    );
}

function RequestActions({ request, onUpdateStatus }) {
    if (request.status === "Pending") {
        return (
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => onUpdateStatus(request.id, "Accepted")}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200"
                >
                    <CheckCircle size={14} />
                    Accept
                </button>

                <button
                    onClick={() => onUpdateStatus(request.id, "Declined")}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                >
                    <XCircle size={14} />
                    Decline
                </button>
            </div>
        );
    }

    if (request.status === "Accepted") {
        return (
            <div className="flex justify-end">
                <button
                    onClick={() => onUpdateStatus(request.id, "In Transit")}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                >
                    <Clock3 size={14} />
                    Mark In Transit
                </button>
            </div>
        );
    }

    if (request.status === "In Transit") {
        return (
            <div className="flex justify-end">
                <button
                    onClick={() => onUpdateStatus(request.id, "Completed")}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#154212] px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-900"
                >
                    <CheckCircle size={14} />
                    Mark Completed
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-end">
            <button className="inline-flex items-center gap-1 rounded-xl border border-[#c2c9bb] px-3 py-2 text-xs font-semibold text-[#154212] transition hover:bg-[#f3f4f3]">
                <Eye size={14} />
                View
            </button>
        </div>
    );
}

function TransactionsTab() {
    const [searchQuery, setSearchQuery] = useState("");
    const [materialFilter, setMaterialFilter] = useState("All");
    const [openActionId, setOpenActionId] = useState(null);

    const transactions = [
        {
            id: "TRX-001",
            customer: "Juan Dela Cruz",
            materials: "Plastic Bottles",
            weight: 45,
            amount: 900,
            date: "May 3, 2026",
            status: "Completed",
        },
        {
            id: "TRX-002",
            customer: "Maria Santos",
            materials: "Aluminum Cans",
            weight: 18,
            amount: 900,
            date: "May 2, 2026",
            status: "Completed",
        },
        {
            id: "TRX-003",
            customer: "Pedro Reyes",
            materials: "Cardboard",
            weight: 30,
            amount: 300,
            date: "May 1, 2026",
            status: "Completed",
        },
    ];

    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch =
            transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.materials.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMaterial =
            materialFilter === "All" || transaction.materials === materialFilter;

        return matchesSearch && matchesMaterial;
    });

    const totalRevenue = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
    );
    const processedWeight = transactions.reduce(
        (sum, transaction) => sum + transaction.weight,
        0
    );
    const transactionCount = transactions.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#154212]">Transactions</h1>
                    <p className="mt-2 text-[#72796e]">
                        Track completed recycling transactions and customer payments.
                    </p>
                </div>

                <button className="rounded-xl border border-[#c2c9bb] bg-white px-5 py-3 text-sm font-semibold text-[#154212] transition hover:bg-[#f3f4f3]">
                    Export CSV
                </button>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <TransactionStatCard
                    title="Total Revenue"
                    value={`₱${totalRevenue.toLocaleString()}`}
                    helper="Completed transaction earnings"
                />
                <TransactionStatCard
                    title="Processed Weight"
                    value={`${processedWeight} kg`}
                    helper="Total recyclable materials processed"
                />
                <TransactionStatCard
                    title="Transactions Count"
                    value={transactionCount}
                    helper="Completed records"
                />
            </section>

            {/* Filters */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full items-center rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 lg:max-w-md">
                        <Search size={18} className="mr-2 text-[#72796e]" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm outline-none"
                            placeholder="Search customer, material, or transaction ID..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className="rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm font-medium text-[#191c1c] outline-none"
                        >
                            <option>All</option>
                            <option>Plastic Bottles</option>
                            <option>Aluminum Cans</option>
                            <option>Cardboard</option>
                        </select>

                        <input
                            type="date"
                            className="rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm font-medium text-[#191c1c] outline-none"
                        />
                    </div>
                </div>
            </section>

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-sm">
                        <thead className="bg-[#f3f4f3] text-[#72796e]">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Materials</th>
                                <th className="px-6 py-4 font-semibold">Weight</th>
                                <th className="px-6 py-4 font-semibold">Total Amount</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100">
                            {filteredTransactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="relative transition hover:bg-[#f9f9f8]"
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-[#191c1c]">
                                            {transaction.customer}
                                        </p>
                                        <p className="text-xs text-[#72796e]">{transaction.id}</p>
                                    </td>

                                    <td className="px-6 py-4 text-[#42493e]">
                                        {transaction.materials}
                                    </td>

                                    <td className="px-6 py-4 font-semibold text-[#154212]">
                                        {transaction.weight} kg
                                    </td>

                                    <td className="px-6 py-4 font-bold text-[#154212]">
                                        ₱{transaction.amount.toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4 text-[#42493e]">
                                        {transaction.date}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                            {transaction.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="relative flex justify-end">
                                            <button
                                                onClick={() =>
                                                    setOpenActionId(
                                                        openActionId === transaction.id
                                                            ? null
                                                            : transaction.id
                                                    )
                                                }
                                                className="rounded-xl p-2 text-[#154212] transition hover:bg-[#f3f4f3]"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openActionId === transaction.id && (
                                                <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl">
                                                    <button
                                                        onClick={() => setOpenActionId(null)}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#154212] transition hover:bg-[#f3f4f3]"
                                                    >
                                                        <Eye size={16} />
                                                        View Details
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTransactions.length === 0 && (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <ReceiptText size={48} className="mb-3 text-[#72796e]" />
                            <h3 className="text-lg font-bold text-[#191c1c]">
                                No transactions found
                            </h3>
                            <p className="mt-1 text-sm text-[#72796e]">
                                Completed customer transactions will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function TransactionStatCard({ title, value, helper }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-[#72796e]">{title}</p>
            <h3 className="mt-1 text-2xl font-bold text-[#154212]">{value}</h3>
            <p className="mt-2 text-xs text-[#72796e]">{helper}</p>
        </div>
    );
}

function SettingsTab() {
  const [toast, setToast] = useState("");
  const [shopForm, setShopForm] = useState({
    shopName: "Teresa Junkshop",
    email: "teresajunkshop@email.com",
    phone: "+63 912 345 6789",
    address: "Teresa, Sta. Mesa, Manila",
    category: "General Recycling",
    description:
      "We accept plastic, paper, metal, glass, and other recyclable materials for drop-off and pickup transactions.",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!shopForm.shopName.trim()) {
      alert("Shop name is required.");
      return;
    }

    if (!shopForm.email.trim()) {
      alert("Email is required.");
      return;
    }

    if (!shopForm.phone.trim()) {
      alert("Phone number is required.");
      return;
    }

    showToast("Shop settings saved successfully.");
  };

  const handleDiscard = () => {
    setShopForm({
      shopName: "Teresa Junkshop",
      email: "teresajunkshop@email.com",
      phone: "+63 912 345 6789",
      address: "Teresa, Sta. Mesa, Manila",
      category: "General Recycling",
      description:
        "We accept plastic, paper, metal, glass, and other recyclable materials for drop-off and pickup transactions.",
    });

    showToast("Changes discarded.");
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-[#154212]">Settings</h1>
        <p className="mt-2 text-[#72796e]">
          Manage shop information, account security, sessions, and media.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-8 xl:col-span-7">
          {/* Shop Information */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9e7cc] text-[#154212]">
                <Store size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#191c1c]">
                  Shop Information
                </h2>
                <p className="text-sm text-[#72796e]">
                  Update your public shop details.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SettingsInput
                  label="Shop Name"
                  value={shopForm.shopName}
                  onChange={(value) =>
                    setShopForm({ ...shopForm, shopName: value })
                  }
                  required
                />

                <SettingsInput
                  label="Email"
                  type="email"
                  value={shopForm.email}
                  onChange={(value) =>
                    setShopForm({ ...shopForm, email: value })
                  }
                  required
                />

                <SettingsInput
                  label="Phone"
                  value={shopForm.phone}
                  onChange={(value) =>
                    setShopForm({ ...shopForm, phone: value })
                  }
                  required
                />

                <SettingsInput
                  label="Category"
                  value={shopForm.category}
                  onChange={(value) =>
                    setShopForm({ ...shopForm, category: value })
                  }
                />
              </div>

              <SettingsInput
                label="Address"
                value={shopForm.address}
                onChange={(value) =>
                  setShopForm({ ...shopForm, address: value })
                }
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#191c1c]">
                  Description
                </label>
                <textarea
                  value={shopForm.description}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, description: e.target.value })
                  }
                  rows="4"
                  className="w-full resize-none rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="rounded-xl border border-[#c2c9bb] px-5 py-3 text-sm font-semibold text-[#191c1c] transition hover:bg-[#f3f4f3]"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          {/* Media */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9e7cc] text-[#154212]">
                <Image size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#191c1c]">
                  Media / Images
                </h2>
                <p className="text-sm text-[#72796e]">
                  Add shop images for your public listing.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-[#c2c9bb] bg-[#f9f9f8] p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c9e7cc] text-[#154212]">
                <Image size={30} />
              </div>

              <h3 className="font-bold text-[#191c1c]">Upload shop image</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[#72796e]">
                Use clear photos of your junkshop entrance, storage area, or
                recyclable sorting area.
              </p>

              <button className="mt-5 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900">
                Choose Image
              </button>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8 xl:col-span-5">
          {/* Security */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9e7cc] text-[#154212]">
                <Shield size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#191c1c]">Security</h2>
                <p className="text-sm text-[#72796e]">
                  Manage password and account protection.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
              />

              <input
                type="password"
                placeholder="New Password"
                className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
              />

              <button
                onClick={() => showToast("Password update request submitted.")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#154212] px-5 py-3 text-sm font-semibold text-[#154212] transition hover:bg-[#f3f4f3]"
              >
                <KeyRound size={18} />
                Update Password
              </button>
            </div>

            <div className="my-6 h-px bg-zinc-100" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#191c1c]">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-[#72796e]">
                  Add an extra layer of security to your account.
                </p>
              </div>

              <button
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  showToast(
                    `Two-factor authentication ${
                      !twoFactorEnabled ? "enabled" : "disabled"
                    }.`
                  );
                }}
                className={`relative h-7 w-14 rounded-full transition ${
                  twoFactorEnabled ? "bg-[#154212]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    twoFactorEnabled ? "left-8" : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Active Sessions */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9e7cc] text-[#154212]">
                <Monitor size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#191c1c]">
                  Active Sessions
                </h2>
                <p className="text-sm text-[#72796e]">
                  Devices currently signed in.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <SessionItem
                device="Chrome on Windows"
                location="Manila, Philippines"
                current
              />
              <SessionItem
                device="Mobile Browser"
                location="Quezon City, Philippines"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#191c1c]">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
      />
    </div>
  );
}

function SessionItem({ device, location, current = false }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#f9f9f8] p-4">
      <div>
        <p className="font-semibold text-[#191c1c]">{device}</p>
        <p className="text-xs text-[#72796e]">{location}</p>
      </div>

      {current ? (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Current
        </span>
      ) : (
        <button className="text-xs font-semibold text-red-600 hover:underline">
          Logout
        </button>
      )}
    </div>
  );
}

function Placeholder({ title }) {
    return (
        <div className="rounded-3xl border border-dashed border-[#c2c9bb] bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-[#154212]">{title}</p>
            <p className="mt-2 text-sm text-[#72796e]">
                Layout is ready. We’ll replace this section in the next part.
            </p>
        </div>
    );
}