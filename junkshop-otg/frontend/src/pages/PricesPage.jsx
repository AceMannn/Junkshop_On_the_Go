// src/pages/PricesPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { Card } from '../components/Card'; // make sure this exists
// import { SearchBar } from '../components/SearchBar'; // comment out if not ready

export default function PricesPage() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceUnits, setPriceUnits] = useState({});

    const categories = [
        { id: 'all', label: 'All Materials', color: 'bg-charcoal' },
        { id: 'plastic', label: 'Plastic', color: 'bg-clean-blue' },
        { id: 'paper', label: 'Paper', color: 'bg-sunny-yellow' },
        { id: 'metal', label: 'Metal', color: 'bg-eco-green' },
        { id: 'glass', label: 'Glass', color: 'bg-leaf-green' },
        { id: 'ewaste', label: 'E-waste', color: 'bg-charcoal' },
    ];

    const priceData = [
        {
            category: 'plastic',
            material: 'PET Bottles (Clear)',
            examples: 'Water bottles, soft drink bottles',
            perKgPrice: '₱15-20',
            perPiecePrice: '₱0.50-1',
            notes: 'Clean and flattened preferred',
            trending: true,
            trendingImage: 'https://images.unsplash.com/photo-1731342484101-c91e0cc1971f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg',
        },
        // ... add other items here, same format
    ];

    const getPrice = (item, materialKey) => {
        const unit = priceUnits[materialKey] || 'per kg';
        return unit === 'per kg' ? item.perKgPrice : item.perPiecePrice;
    };

    const getUnit = (materialKey) => priceUnits[materialKey] || 'per kg';
    const setUnit = (materialKey, unit) => {
        setPriceUnits(prev => ({ ...prev, [materialKey]: unit }));
    };

    const filteredData = priceData.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch =
            searchQuery === '' ||
            item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.examples.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const trendingMaterials = priceData.filter(item => item.trending);

    return (
        <div className="pt-20 min-h-screen bg-light-gray">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-sunny-yellow via-eco-green to-leaf-green text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="mb-4 text-white">Recyclable Materials Price Guide</h2>
                        <p className="text-xl text-white/90 mb-8">
                            Current market prices for recyclable materials in Teresa, Sta. Mesa
                        </p>

                        <div className="max-w-2xl">
                            {/* <SearchBar
                placeholder="Search materials (e.g., plastic bottles, metal...)"
                value={searchQuery}
                onChange={setSearchQuery}
              /> */}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Categories */}
            <section className="bg-white border-b border-gray-200 sticky top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <motion.button
                                key={cat.id}
                                className={`px-4 py-2 rounded-[12px] whitespace-nowrap transition-colors ${selectedCategory === cat.id ? `${cat.color} text-white` : 'bg-light-gray text-charcoal hover:bg-gray-300'
                                    }`}
                                onClick={() => setSelectedCategory(cat.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {cat.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Trending Section */}
                {selectedCategory === 'all' && searchQuery === '' && (
                    <section className="mb-12">
                        <motion.div
                            className="flex items-center gap-2 mb-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <TrendingUp className="text-eco-green" size={28} />
                            <h3>Trending Materials</h3>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {trendingMaterials.map((item, index) => (
                                <Card key={index} delay={index * 0.1}>
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="text-base">{item.material}</h4>
                                        <TrendingUp className="text-eco-green flex-shrink-0" size={20} />
                                    </div>
                                    {item.trendingImage && (
                                        <div className="w-full h-48 rounded-lg overflow-hidden mb-3">
                                            <img src={item.trendingImage} alt={item.material} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600">{item.examples}</p>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Price Table */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3>
                            {selectedCategory === 'all'
                                ? 'All Materials'
                                : categories.find(c => c.id === selectedCategory)?.label}
                        </h3>
                        <span className="text-gray-600">{filteredData.length} items</span>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block bg-white rounded-[16px] shadow-md overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-eco-green text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left px-6 py-4">Material</th>
                                        <th className="text-left px-6 py-4">Example Items</th>
                                        <th className="text-left px-6 py-4">Price</th>
                                        <th className="text-left px-6 py-4">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        <motion.tr
                                            key={index}
                                            className="border-b border-gray-200 hover:bg-light-gray transition-colors"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{item.material}</span>
                                                    {item.trending && <TrendingUp className="text-eco-green" size={16} />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.examples}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 items-center">
                                                    <div className="bg-sunny-yellow px-3 py-1 rounded-lg">
                                                        <span className="font-bold text-charcoal">{getPrice(item, item.material)}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            value={getUnit(item.material)}
                                                            onChange={e => setUnit(item.material, e.target.value)}
                                                            className="bg-sunny-yellow px-3 py-1 rounded-lg font-semibold text-charcoal appearance-none pr-8 cursor-pointer border-none outline-none h-full"
                                                        >
                                                            <option value="per kg">per kg</option>
                                                            <option value="per piece">per piece</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal" size={16} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.notes}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {filteredData.map((item, index) => (
                            <Card key={index} delay={index * 0.05}>
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="text-base">{item.material}</h4>
                                    {item.trending && <TrendingUp className="text-eco-green flex-shrink-0" size={20} />}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{item.examples}</p>
                                <div className="flex gap-2 mb-3 flex-wrap sm:flex-nowrap">
                                    <div className="bg-sunny-yellow px-4 py-2 rounded-lg">
                                        <span className="font-bold text-charcoal text-lg">{getPrice(item, item.material)}</span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={getUnit(item.material)}
                                            onChange={e => setUnit(item.material, e.target.value)}
                                            className="bg-sunny-yellow px-4 py-2 rounded-lg font-semibold text-charcoal text-lg appearance-none pr-8 cursor-pointer border-none outline-none h-full"
                                        >
                                            <option value="per kg">per kg</option>
                                            <option value="per piece">per piece</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal" size={18} />
                                    </div>
                                </div>
                                <div className="bg-light-gray px-3 py-2 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Note:</span> {item.notes}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Info Box */}
                <motion.div
                    className="mt-12 bg-clean-blue/10 border-2 border-clean-blue rounded-[16px] p-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h4 className="mb-3">📌 Price Information</h4>
                    <ul className="space-y-2 text-gray-700">
                        <li>• Prices are updated weekly and may vary by junkshop</li>
                        <li>• Clean and sorted materials typically get better prices</li>
                        <li>• Bulk quantities may receive higher rates</li>
                        <li>• Contact junkshops directly for exact current pricing</li>
                        <li>• Prices shown are averages from Teresa, Sta. Mesa area</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
