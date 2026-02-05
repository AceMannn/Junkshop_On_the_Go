import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    DollarSign,
    Settings,
    LogOut,
    Plus,
    Edit2,
    Trash2,
    Power,
    PowerOff,
    X,
    Search,
    TrendingUp,
    Users,
    Activity,
    User,
} from 'lucide-react';
import { AccountPanel } from './AccountPanel';

export default function ProviderDashboard({ onLogout, materials, onUpdateMaterials }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        unit: 'kg',
    });

    const handleAddMaterial = () => {
        if (!formData.name || !formData.category || !formData.price) return;

        const newMaterial = {
            id: Date.now().toString(),
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            unit: formData.unit,
            available: true,
        };
        onUpdateMaterials([...materials, newMaterial]);
        setIsAddModalOpen(false);
        setFormData({ name: '', category: '', price: '', unit: 'kg' });
    };

    const handleEditMaterial = (material) => {
        setEditingMaterial(material);
        setFormData({
            name: material.name,
            category: material.category,
            price: material.price.toString(),
            unit: material.unit,
        });
    };

    const handleUpdateMaterial = () => {
        if (!editingMaterial || !formData.name || !formData.category || !formData.price) return;

        const updatedMaterials = materials.map((m) =>
            m.id === editingMaterial.id
                ? {
                    ...m,
                    name: formData.name,
                    category: formData.category,
                    price: parseFloat(formData.price),
                    unit: formData.unit,
                }
                : m
        );
        onUpdateMaterials(updatedMaterials);
        setEditingMaterial(null);
        setFormData({ name: '', category: '', price: '', unit: 'kg' });
    };

    const handleDeleteMaterial = (id) => {
        if (confirm('Are you sure you want to delete this material?')) {
            onUpdateMaterials(materials.filter((m) => m.id !== id));
        }
    };

    const handleToggleAvailability = (id) => {
        const updatedMaterials = materials.map((m) =>
            m.id === id ? { ...m, available: !m.available } : m
        );
        onUpdateMaterials(updatedMaterials);
    };

    const filteredMaterials = materials.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMaterials = materials.length;
    const activeMaterials = materials.filter((m) => m.available).length;
    const averagePrice = materials.length > 0
        ? (materials.reduce((sum, m) => sum + m.price, 0) / materials.length).toFixed(2)
        : '0.00';

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                {/* Logo & Brand */}
                <div className="p-6 bg-gradient-to-br from-eco-green to-leaf-green">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#3DA35D"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6"
                            >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight">JunkShop</h3>
                            <p className="text-xs text-white/90 font-medium">On-The-Go</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs font-semibold text-white/90">Provider Dashboard</p>
                        <p className="text-xs text-white/70 mt-0.5">Teresa, Sta. Mesa</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <SidebarButton
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <SidebarButton
                        icon={<Package className="w-5 h-5" />}
                        label="Recyclable Materials"
                        active={activeTab === 'materials'}
                        onClick={() => setActiveTab('materials')}
                    />
                    <SidebarButton
                        icon={<DollarSign className="w-5 h-5" />}
                        label="Price Management"
                        active={activeTab === 'prices'}
                        onClick={() => setActiveTab('prices')}
                    />
                    <SidebarButton
                        icon={<Activity className="w-5 h-5" />}
                        label="Availability"
                        active={activeTab === 'availability'}
                        onClick={() => setActiveTab('availability')}
                    />
                    <div className="pt-4 pb-2">
                        <div className="h-px bg-gray-200"></div>
                    </div>
                    <SidebarButton
                        icon={<Settings className="w-5 h-5" />}
                        label="Settings"
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Content Container */}
                <div className="min-h-screen p-8 flex items-start justify-center">
                    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-eco-green to-leaf-green px-8 py-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#3DA35D"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-6 h-6"
                                        >
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                            <line x1="12" y1="22.08" x2="12" y2="12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-xl">Provider Management</h2>
                                        <p className="text-white/90 text-sm">Manage your recyclable materials and prices</p>
                                    </div>
                                </div>

                                {/* Account Button */}
                                <button
                                    onClick={() => setIsAccountPanelOpen(true)}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
                                    title="Account"
                                >
                                    <User className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                                <p className="text-white/90 text-sm">
                                    {activeTab === 'dashboard' && 'Dashboard Overview'}
                                    {activeTab === 'materials' && 'Recyclable Materials'}
                                    {activeTab === 'prices' && 'Price Management'}
                                    {activeTab === 'availability' && 'Availability Settings'}
                                    {activeTab === 'settings' && 'Account Settings'}
                                </p>
                                <p className="text-white/80 text-xs">
                                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <SummaryCard
                                            title="Total Materials"
                                            value={totalMaterials.toString()}
                                            subtitle={`${activeMaterials} active`}
                                            icon={<Package className="w-6 h-6" />}
                                            color="eco-green"
                                            trend="+2 this week"
                                        />
                                        <SummaryCard
                                            title="Active Listings"
                                            value={activeMaterials.toString()}
                                            subtitle={`${totalMaterials - activeMaterials} inactive`}
                                            icon={<Power className="w-6 h-6" />}
                                            color="clean-blue"
                                            trend="Live on site"
                                        />
                                        <SummaryCard
                                            title="Avg. Price"
                                            value={`₱${averagePrice}`}
                                            subtitle="per kg"
                                            icon={<DollarSign className="w-6 h-6" />}
                                            color="sunny-yellow"
                                            trend="Market rate"
                                        />
                                        <SummaryCard
                                            title="Views Today"
                                            value="124"
                                            subtitle="+18% vs yesterday"
                                            icon={<Users className="w-6 h-6" />}
                                            color="leaf-green"
                                            trend="Growing"
                                        />
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Recent Activity */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-charcoal flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-eco-green" />
                                                    Recent Activity
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                <ActivityItem
                                                    action="Price updated"
                                                    material="PET Bottles (Clear)"
                                                    time="2 hours ago"
                                                />
                                                <ActivityItem
                                                    action="Material added"
                                                    material="Cardboard"
                                                    time="5 hours ago"
                                                />
                                                <ActivityItem
                                                    action="Status changed"
                                                    material="Aluminum Cans"
                                                    time="1 day ago"
                                                />
                                            </div>
                                        </div>

                                        {/* Top Materials */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-charcoal flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5 text-eco-green" />
                                                    Top Materials
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                {materials.slice(0, 3).map((material) => (
                                                    <div key={material.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                                        <div>
                                                            <p className="font-medium text-charcoal text-sm">{material.name}</p>
                                                            <p className="text-xs text-charcoal/60 capitalize">{material.category}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-eco-green">₱{material.price}</p>
                                                            <p className="text-xs text-charcoal/60">per {material.unit}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-gradient-to-br from-eco-green/5 to-leaf-green/5 rounded-xl border border-eco-green/20 p-6">
                                        <h3 className="font-bold text-charcoal mb-4">Quick Actions</h3>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => {
                                                    setActiveTab('materials');
                                                    setIsAddModalOpen(true);
                                                }}
                                                className="px-5 py-2.5 bg-eco-green text-white rounded-lg text-sm font-semibold hover:bg-eco-green/90 transition-all shadow-sm"
                                            >
                                                + Add Material
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('prices')}
                                                className="px-5 py-2.5 bg-white border-2 border-eco-green text-eco-green rounded-lg text-sm font-semibold hover:bg-eco-green/5 transition-all"
                                            >
                                                Update Prices
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('availability')}
                                                className="px-5 py-2.5 bg-white border-2 border-clean-blue text-clean-blue rounded-lg text-sm font-semibold hover:bg-clean-blue/5 transition-all"
                                            >
                                                Manage Availability
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'materials' || activeTab === 'prices') && (
                                <div className="space-y-6">
                                    {/* Search */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                        <div className="relative max-w-md">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                            <input
                                                type="text"
                                                placeholder="Search materials by name or category..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Materials Table */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gradient-to-r from-eco-green to-leaf-green text-white">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold">Material Name</th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                                        <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {filteredMaterials.map((material, index) => (
                                                        <motion.tr
                                                            key={material.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            className="hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <p className="font-semibold text-charcoal">{material.name}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex px-3 py-1 bg-gray-100 text-charcoal/70 rounded-full text-xs font-medium capitalize">
                                                                    {material.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-bold text-eco-green">₱{material.price}</p>
                                                                <p className="text-xs text-charcoal/60">per {material.unit}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => handleToggleAvailability(material.id)}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${material.available
                                                                            ? 'bg-eco-green/10 text-eco-green hover:bg-eco-green/20'
                                                                            : 'bg-gray-100 text-charcoal/50 hover:bg-gray-200'
                                                                        }`}
                                                                >
                                                                    {material.available ? (
                                                                        <>
                                                                            <Power className="w-3.5 h-3.5" />
                                                                            Active
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <PowerOff className="w-3.5 h-3.5" />
                                                                            Inactive
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleEditMaterial(material)}
                                                                        className="p-2 text-clean-blue hover:bg-clean-blue/10 rounded-lg transition-all"
                                                                        title="Edit material"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMaterial(material.id)}
                                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Delete material"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {filteredMaterials.length === 0 && (
                                                <div className="text-center py-12">
                                                    <Package className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
                                                    <p className="text-charcoal/60">No materials found</p>
                                                    <p className="text-sm text-charcoal/40 mt-1">Try adjusting your search</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'availability' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="font-bold text-charcoal mb-4">Material Availability</h3>
                                        <p className="text-sm text-charcoal/60 mb-6">
                                            Toggle material availability to control what customers see on the prices page.
                                        </p>

                                        <div className="space-y-3">
                                            {materials.map((material) => (
                                                <div
                                                    key={material.id}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-charcoal">{material.name}</p>
                                                        <p className="text-sm text-charcoal/60 capitalize">{material.category} • ₱{material.price}/{material.unit}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleAvailability(material.id)}
                                                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${material.available
                                                                ? 'bg-eco-green text-white hover:bg-eco-green/90'
                                                                : 'bg-gray-300 text-charcoal/70 hover:bg-gray-400'
                                                            }`}
                                                    >
                                                        {material.available ? 'Available' : 'Unavailable'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="font-bold text-charcoal mb-4">Account Settings</h3>
                                        <p className="text-sm text-charcoal/60">Manage your account preferences and settings.</p>

                                        <div className="mt-6 space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-charcoal mb-1">Business Name</p>
                                                <p className="text-sm text-charcoal/60">Teresa Junkshop</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-charcoal mb-1">Location</p>
                                                <p className="text-sm text-charcoal/60">Teresa, Sta. Mesa, Manila</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-charcoal mb-1">Contact Number</p>
                                                <p className="text-sm text-charcoal/60">+63 912 345 6789</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add/Edit Material Modal */}
            {(isAddModalOpen || editingMaterial) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-charcoal">
                                {editingMaterial ? 'Edit Material' : 'Add New Material'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingMaterial(null);
                                    setFormData({ name: '', category: '', price: '', unit: 'kg' });
                                }}
                                className="text-charcoal/40 hover:text-charcoal transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-charcoal">Material Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., PET Bottles"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-charcoal">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 text-sm"
                                >
                                    <option value="">Select a category</option>
                                    <option value="plastic">Plastic</option>
                                    <option value="metal">Metal</option>
                                    <option value="paper">Paper</option>
                                    <option value="glass">Glass</option>
                                    <option value="electronics">Electronics</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-charcoal">Price (₱)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-charcoal">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 text-sm"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="pc">pc</option>
                                        <option value="lb">lb</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingMaterial(null);
                                        setFormData({ name: '', category: '', price: '', unit: 'kg' });
                                    }}
                                    className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-charcoal rounded-lg hover:bg-gray-50 font-semibold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                                    disabled={!formData.name || !formData.category || !formData.price}
                                    className="flex-1 px-5 py-2.5 bg-eco-green text-white rounded-lg hover:bg-eco-green/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all"
                                >
                                    {editingMaterial ? 'Update Material' : 'Add Material'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Account Panel */}
            <AccountPanel
                isOpen={isAccountPanelOpen}
                onClose={() => setIsAccountPanelOpen(false)}
                onLogout={onLogout}
                role="provider"
            />
        </div>
    );
}

function SidebarButton({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active
                    ? 'bg-eco-green text-white shadow-sm'
                    : 'text-charcoal/70 hover:bg-gray-100 hover:text-charcoal'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function SummaryCard({ title, value, subtitle, icon, color, trend }) {
    const colorClasses = {
        'eco-green': 'from-eco-green/10 to-eco-green/5 text-eco-green border-eco-green/20',
        'clean-blue': 'from-clean-blue/10 to-clean-blue/5 text-clean-blue border-clean-blue/20',
        'sunny-yellow': 'from-sunny-yellow/10 to-sunny-yellow/5 text-sunny-yellow border-sunny-yellow/20',
        'leaf-green': 'from-leaf-green/10 to-leaf-green/5 text-leaf-green border-leaf-green/20',
    }[color];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-charcoal/60">{title}</span>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorClasses}`}>
                    {icon}
                </div>
            </div>
            <div className="mb-1">
                <p className="text-3xl font-bold text-charcoal">{value}</p>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-charcoal/60">{subtitle}</p>
                {trend && (
                    <span className="text-xs font-semibold text-eco-green">{trend}</span>
                )}
            </div>
        </div>
    );
}

function ActivityItem({ action, material, time }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <div className="w-2 h-2 bg-eco-green rounded-full mt-2"></div>
            <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">{action}</p>
                <p className="text-xs text-charcoal/60">{material}</p>
            </div>
            <span className="text-xs text-charcoal/40">{time}</span>
        </div>
    );
}