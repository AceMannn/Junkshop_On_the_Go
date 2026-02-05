import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    MapPin,
    DollarSign,
    User,
    LogOut,
    Package,
    TrendingUp,
    Star
} from 'lucide-react';
import logoImage from 'figma:asset/c9f53fce1e446cb129eb8ac870625932623f3b5f.png';

export default function CustomerDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('overview');

    // Sample data
    const recentTransactions = [
        { id: 1, date: '2026-02-01', item: 'PET Bottles', weight: '5 kg', amount: '₱75', shop: 'Green Haven Junkshop' },
        { id: 2, date: '2026-01-28', item: 'Cardboard', weight: '10 kg', amount: '₱80', shop: 'EcoRecycle Center' },
        { id: 3, date: '2026-01-25', item: 'Aluminum Cans', weight: '2 kg', amount: '₱90', shop: 'Green Haven Junkshop' },
    ];

    const favoriteShops = [
        { id: 1, name: 'Green Haven Junkshop', rating: 4.8, visits: 12 },
        { id: 2, name: 'EcoRecycle Center', rating: 4.6, visits: 8 },
        { id: 3, name: 'Teresa Recycling Hub', rating: 4.9, visits: 5 },
    ];

    const stats = [
        { label: 'Total Recycled', value: '127 kg', icon: Package, color: 'bg-eco-green' },
        { label: 'Total Earnings', value: '₱1,245', icon: DollarSign, color: 'bg-clean-blue' },
        { label: 'Transactions', value: '18', icon: TrendingUp, color: 'bg-sunny-yellow' },
        { label: 'Carbon Saved', value: '84 kg', icon: Star, color: 'bg-leaf-green' },
    ];

    return (
        <div className="min-h-screen bg-light-gray">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <img src={logoImage} alt="JunkShop On-The-Go" className="h-12 w-auto" />
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-charcoal">Customer Dashboard</h1>
                                <p className="text-sm text-charcoal/60">Welcome back!</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-charcoal hover:bg-light-gray rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-6 overflow-x-auto">
                        <NavTab
                            icon={LayoutDashboard}
                            label="Overview"
                            isActive={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                        />
                        <NavTab
                            icon={Package}
                            label="My Transactions"
                            isActive={activeTab === 'transactions'}
                            onClick={() => setActiveTab('transactions')}
                        />
                        <NavTab
                            icon={MapPin}
                            label="Favorite Shops"
                            isActive={activeTab === 'favorites'}
                            onClick={() => setActiveTab('favorites')}
                        />
                        <NavTab
                            icon={User}
                            label="Profile"
                            isActive={activeTab === 'profile'}
                            onClick={() => setActiveTab('profile')}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-xl p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-charcoal/60 mb-1">{stat.label}</p>
                                            <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
                                        </div>
                                        <div className={`${stat.color} p-3 rounded-lg`}>
                                            <stat.icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Transactions */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-charcoal mb-4">Recent Transactions</h3>
                                <div className="space-y-3">
                                    {recentTransactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                            <div>
                                                <p className="font-medium text-charcoal">{transaction.item}</p>
                                                <p className="text-sm text-charcoal/60">{transaction.shop}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-eco-green">{transaction.amount}</p>
                                                <p className="text-sm text-charcoal/60">{transaction.weight}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Favorite Shops */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-charcoal mb-4">Favorite Shops</h3>
                                <div className="space-y-3">
                                    {favoriteShops.map((shop) => (
                                        <div key={shop.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                            <div>
                                                <p className="font-medium text-charcoal">{shop.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Star className="w-4 h-4 text-sunny-yellow fill-sunny-yellow" />
                                                    <span className="text-sm text-charcoal/60">{shop.rating}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-charcoal/60">{shop.visits} visits</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-charcoal mb-6">Transaction History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal">Item</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal">Weight</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal">Shop</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-charcoal">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-charcoal/80">{transaction.date}</td>
                                            <td className="py-3 px-4 text-sm text-charcoal font-medium">{transaction.item}</td>
                                            <td className="py-3 px-4 text-sm text-charcoal/80">{transaction.weight}</td>
                                            <td className="py-3 px-4 text-sm text-charcoal/80">{transaction.shop}</td>
                                            <td className="py-3 px-4 text-sm text-eco-green font-semibold text-right">{transaction.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-charcoal mb-6">Favorite Junkshops</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {favoriteShops.map((shop) => (
                                <div key={shop.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <h3 className="font-semibold text-charcoal mb-2">{shop.name}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-sunny-yellow fill-sunny-yellow" />
                                        <span className="text-sm text-charcoal/80">{shop.rating} rating</span>
                                    </div>
                                    <p className="text-sm text-charcoal/60">{shop.visits} total visits</p>
                                    <button className="mt-3 w-full py-2 bg-eco-green text-white rounded-lg text-sm hover:bg-eco-green/90 transition-colors">
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                        <h2 className="text-xl font-semibold text-charcoal mb-6">Profile Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue="John Doe"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue="john.doe@email.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    defaultValue="+63 912 345 6789"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Address</label>
                                <input
                                    type="text"
                                    defaultValue="Teresa, Sta. Mesa, Manila"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20"
                                />
                            </div>
                            <button className="w-full py-3 bg-eco-green text-white rounded-lg font-semibold hover:bg-eco-green/90 transition-colors mt-6">
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function NavTab({ icon: Icon, label, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${isActive
                    ? 'border-eco-green text-eco-green'
                    : 'border-transparent text-charcoal/60 hover:text-charcoal'
                }`}
        >
            <Icon size={18} />
            <span className="font-medium">{label}</span>
        </button>
    );
}
