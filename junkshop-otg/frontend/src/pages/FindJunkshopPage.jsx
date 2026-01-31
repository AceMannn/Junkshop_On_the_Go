// src/pages/FindJunkshopPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Star, Filter } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function FindJunkshopPage() {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'open', label: 'Open Now' },
        { id: 'plastic', label: 'Accepts Plastic' },
        { id: 'metal', label: 'Accepts Metal' },
        { id: 'paper', label: 'Accepts Paper' }
    ];

    const junkshops = [
        {
            id: 1,
            name: "Mang Tonio's Junkshop",
            distance: '0.3 km',
            address: '123 P. Sanchez St., Teresa, Sta. Mesa',
            phone: '0912-345-6789',
            hours: '8:00 AM - 6:00 PM',
            status: 'Open',
            rating: 4.8,
            materials: ['Plastic', 'Metal', 'Paper', 'Glass'],
            topPrice: 'Metal: ₱50/kg'
        },
        {
            id: 2,
            name: 'Green Recyclers Teresa',
            distance: '0.5 km',
            address: '456 N. Domingo St., Teresa, Sta. Mesa',
            phone: '0923-456-7890',
            hours: '7:00 AM - 7:00 PM',
            status: 'Open',
            rating: 4.6,
            materials: ['Plastic', 'Paper', 'E-waste'],
            topPrice: 'E-waste: ₱100/kg'
        },
        {
            id: 3,
            name: 'Barangay Recycle Hub',
            distance: '0.8 km',
            address: '789 Mayon St., Teresa, Sta. Mesa',
            phone: '0934-567-8901',
            hours: '9:00 AM - 5:00 PM',
            status: 'Closed',
            rating: 4.5,
            materials: ['Plastic', 'Metal', 'Paper', 'Glass', 'E-waste'],
            topPrice: 'All materials accepted'
        },
        {
            id: 4,
            name: 'EcoStar Junkshop',
            distance: '1.2 km',
            address: '321 Arayat St., Teresa, Sta. Mesa',
            phone: '0945-678-9012',
            hours: '8:30 AM - 6:30 PM',
            status: 'Open',
            rating: 4.7,
            materials: ['Metal', 'Paper', 'Cardboard'],
            topPrice: 'Metal: ₱48/kg'
        }
    ];

    const filteredShops = junkshops.filter(shop => {
        const matchesSearch =
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.materials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter =
            selectedFilter === 'all' ||
            (selectedFilter === 'open'
                ? shop.status === 'Open'
                : shop.materials.includes(selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1))
            );
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="pt-20 min-h-screen bg-light-gray pb-20 lg:pb-0">
            {/* Hero */}
            <section className="bg-gradient-to-br from-eco-green to-leaf-green text-white py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="mb-4 text-white">Find Junkshops Near You</h2>
                        <p className="text-lg lg:text-xl text-white/90 mb-6 lg:mb-8">
                            Discover trusted junkshops in Teresa, Sta. Mesa, Manila
                        </p>

                        <div className="max-w-2xl mx-auto">
                            <SearchBar
                                placeholder="Search by name, material, or location..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                showFilter={true}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filters */}
            <section className="bg-white border-b border-gray-200 sticky top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Filter className="text-gray-500 flex-shrink-0" size={20} />
                        {filters.map(filter => (
                            <motion.button
                                key={filter.id}
                                className={`px-3 lg:px-4 py-2 rounded-[12px] whitespace-nowrap transition-colors text-sm lg:text-base ${selectedFilter === filter.id
                                        ? 'bg-eco-green text-white'
                                        : 'bg-light-gray text-charcoal hover:bg-gray-300'
                                    }`}
                                onClick={() => setSelectedFilter(filter.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {filter.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Map Section */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <motion.div
                            className="bg-white rounded-[16px] p-4 shadow-md h-[400px] lg:h-[600px] mb-6 lg:mb-8"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="relative h-full bg-gradient-to-br from-clean-blue/20 to-eco-green/20 rounded-[12px] overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center px-4">
                                        <MapPin className="text-eco-green mx-auto mb-4" size={48} />
                                        <p className="text-gray-600 text-sm lg:text-base">Interactive Map View</p>
                                        <p className="text-xs lg:text-sm text-gray-500 mt-2">
                                            Showing {filteredShops.length} junkshops in Teresa, Sta. Mesa
                                        </p>
                                    </div>
                                </div>

                                {filteredShops.map((shop, i) => (
                                    <motion.div
                                        key={shop.id}
                                        className="absolute"
                                        style={{
                                            top: `${20 + i * 15}%`,
                                            left: `${30 + (i % 2) * 30}%`
                                        }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
                                    >
                                        <div className="relative group cursor-pointer">
                                            <MapPin
                                                className={shop.status === 'Open' ? 'text-eco-green' : 'text-gray-400'}
                                                size={32}
                                                fill={shop.status === 'Open' ? '#3DA35D' : '#9CA3AF'}
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-charcoal text-white text-xs lg:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                {shop.name}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* List Section */}
                    <div className="space-y-4 order-1 lg:order-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl lg:text-2xl">Nearby Junkshops</h3>
                            <span className="text-sm text-gray-600">{filteredShops.length} results</span>
                        </div>

                        {filteredShops.map((shop, index) => (
                            <motion.div
                                key={shop.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card hover={true}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="mb-1">{shop.name}</h4>
                                            <div className="flex items-center gap-1 mb-2">
                                                <Star className="text-sunny-yellow fill-sunny-yellow" size={16} />
                                                <span className="text-sm font-semibold">{shop.rating}</span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm ${shop.status === 'Open'
                                                ? 'bg-eco-green text-white'
                                                : 'bg-gray-300 text-gray-600'
                                            }`}>
                                            {shop.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>{shop.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="flex-shrink-0" />
                                            <span>{shop.hours}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="flex-shrink-0" />
                                            <span>{shop.phone}</span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm font-semibold mb-2">Accepted Materials:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {shop.materials.map(material => (
                                                <span
                                                    key={material}
                                                    className="px-2 py-1 bg-leaf-green/20 text-eco-green rounded-lg text-xs"
                                                >
                                                    {material}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-sunny-yellow/20 px-3 py-2 rounded-lg mb-4">
                                        <p className="text-sm font-semibold text-charcoal">{shop.topPrice}</p>
                                    </div>

                                    <div className="flex flex-col xs:flex-row gap-2">
                                        <Button className="text-sm sm:text-xl py-1 px-1 sm:px-2 whitespace-nowrap">
                                            Get Directions
                                        </Button>
                                        <Button variant="outline" className="text-sm sm:text-xl py-1 px-1 sm:px-2 whitespace-nowrap">
                                            Call Now
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
                <Button className="w-full">View Map</Button>
            </div>
        </div>
    );
}
