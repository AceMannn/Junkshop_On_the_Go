import { motion } from 'framer-motion';
import { Search, DollarSign, MapPin, Leaf, Recycle, Package, Trash2, Smartphone, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
//import { ImageWithFallback } from '../figma/ImageWithFallback';

export default function HomePage({ onNavigate }) {
    const howItWorks = [
        {
            icon: Search,
            title: 'Search Recyclables',
            description: 'Identify what materials you can recycle',
            color: 'bg-eco-green'
        },
        {
            icon: DollarSign,
            title: 'Check Prices',
            description: 'Know the current market value',
            color: 'bg-sunny-yellow'
        },
        {
            icon: MapPin,
            title: 'Locate Junkshop',
            description: 'Find the nearest junkshop',
            color: 'bg-clean-blue'
        },
        {
            icon: Leaf,
            title: 'Earn & Recycle',
            description: 'Turn trash into cash sustainably',
            color: 'bg-leaf-green'
        }
    ];

    const recyclables = [
        {
            name: 'PET Bottle',
            image: 'https://images.unsplash.com/photo-1558640476-437a2b9438a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwYm90dGxlJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            price: '₱15-20/kg',
            icon: Recycle
        },
        {
            name: 'Scrap Metal',
            image: 'https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY3JhcCUyMG1ldGFsJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            price: '₱35-50/kg',
            icon: Package
        },
        {
            name: 'Cardboard',
            image: 'https://images.unsplash.com/photo-1719600804011-3bff3909b183?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkYm9hcmQlMjBib3hlcyUyMHJlY3ljbGluZ3xlbnwxfHx8fDE3NjUzNjg0MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            price: '₱8-12/kg',
            icon: Package
        },
        {
            name: 'Glass Bottles',
            image: 'https://images.unsplash.com/photo-1554208873-4292cf6c952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGJvdHRsZXMlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            price: '₱3-5/pc',
            icon: Recycle
        },
        {
            name: 'Plastic Bags',
            image: 'https://images.unsplash.com/photo-1637308101453-2055fda23a65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwYmFncyUyMHdhc3RlfGVufDF8fHx8MTc2NTI4ODkzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            price: '₱5-8/kg',
            icon: ShoppingBag
        },
        {
            name: 'E-waste',
            image: 'https://images.unsplash.com/photo-1728610996936-d93900f1886b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwd2FzdGUlMjBld2FzdGV8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            price: '₱20-100/kg',
            icon: Smartphone
        }
    ];

    const recyclingSteps = [
        { title: 'Clean bottles', icon: '🧼' },
        { title: 'Sort by type', icon: '♻️' },
        { title: 'Remove caps', icon: '🔓' },
        { title: 'Store dry recyclables', icon: '📦' }
    ];

    const stats = [
        { label: '+200 families helped', value: '200+' },
        { label: 'Local junkshops supported', value: '15' },
        { label: 'Over 1 ton recycled monthly', value: '1T+' }
    ];

    return (
        <div className="pt-20">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-light-gray to-white overflow-hidden">
                {/* Decorative leaf shapes */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-leaf-green/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-eco-green/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <h1 className="mb-6">
                                Recycle Smarter, <span className="text-eco-green">Earn More.</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Identify recyclables, know their value, and find junkshops in Teresa, Sta. Mesa, Manila.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={() => onNavigate('find')}>
                                    Find Junkshop Near Me
                                </Button>
                                <Button variant="outline" onClick={() => onNavigate('prices')}>
                                    Browse Prices
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative"
                        >
                            {/* <ImageWithFallback
                                src="https://images.unsplash.com/photo-1763741218261-356c5ea66bfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxGaWxpcGlubyUyMG5laWdoYm9yaG9vZCUyMGNvbW11bml0eSUyMGNsZWFuaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt="Community cleaning in Filipino neighborhood"
                                className="rounded-[24px] shadow-2xl w-full h-auto"
                            /> */}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">Simple steps to start recycling</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {howItWorks.map((step, index) => (
                            <Card key={index} delay={index * 0.1}>
                                <motion.div
                                    className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-4`}
                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <step.icon className="text-white" size={32} />
                                </motion.div>
                                <h4 className="mb-2">{step.title}</h4>
                                <p className="text-gray-600">{step.description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recyclable Catalog */}
            <section className="py-20 bg-light-gray">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4">What Can You Recycle?</h2>
                        <p className="text-xl text-gray-600">Popular recyclable materials in your area</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {recyclables.map((item, index) => (
                            <Card key={index} delay={index * 0.1}>
                                <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                                    {/* <ImageWithFallback
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    /> */}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="mb-1">{item.name}</h4>
                                        <div className="inline-block bg-sunny-yellow px-3 py-1 rounded-lg">
                                            <span className="font-semibold text-charcoal">{item.price}</span>
                                        </div>
                                    </div>
                                    <item.icon className="text-eco-green" size={32} />
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center">
                        <Button onClick={() => onNavigate('prices')}>View All Recyclables</Button>
                    </div>
                </div>
            </section>

            {/* Junkshop Locator Preview */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="mb-4">Find Junkshops Near You</h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Discover trusted junkshops in Teresa, Sta. Mesa with real-time availability and accepted materials.
                            </p>

                            <div className="space-y-4 mb-8">
                                {[
                                    { name: 'Mang Tonio\'s Junkshop', distance: '0.3 km', status: 'Open' },
                                    { name: 'Green Recyclers Teresa', distance: '0.5 km', status: 'Open' },
                                    { name: 'Barangay Recycle Hub', distance: '0.8 km', status: 'Closed' }
                                ].map((shop, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-light-gray rounded-[12px]"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-eco-green rounded-full flex items-center justify-center">
                                                <MapPin className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-base mb-0">{shop.name}</h4>
                                                <p className="text-sm text-gray-600">{shop.distance} away</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm ${shop.status === 'Open' ? 'bg-eco-green text-white' : 'bg-gray-300 text-gray-600'
                                            }`}>
                                            {shop.status}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            <Button onClick={() => onNavigate('find')}>Open Full Map</Button>
                        </motion.div>

                        <motion.div
                            className="relative h-[500px] bg-light-gray rounded-[24px] overflow-hidden"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            {/* Map mockup */}
                            <div className="absolute inset-0 bg-gradient-to-br from-clean-blue/20 to-eco-green/20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin className="text-eco-green mx-auto mb-4" size={64} />
                                    <p className="text-gray-600">Interactive Map</p>
                                </div>
                            </div>
                            {/* Mock pins */}
                            {[
                                { top: '30%', left: '40%' },
                                { top: '50%', left: '60%' },
                                { top: '60%', left: '35%' }
                            ].map((pos, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-10 h-10"
                                    style={{ top: pos.top, left: pos.left }}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
                                >
                                    <MapPin className="text-eco-green" size={40} fill="#3DA35D" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Recycling Guide Preview */}
            <section className="py-20 bg-light-gray">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4">Quick Recycling Tips</h2>
                        <p className="text-xl text-gray-600">Follow these simple steps for better recycling</p>
                    </motion.div>

                    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                        {recyclingSteps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="min-w-[280px] bg-white p-8 rounded-[16px] shadow-md text-center"
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-6xl mb-4">{step.icon}</div>
                                <h4>{step.title}</h4>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Button onClick={() => onNavigate('guide')}>View Full Guide</Button>
                    </div>
                </div>
            </section>

            {/* Community Impact */}
            <section className="py-20 bg-eco-green text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4 text-white">Community Impact</h2>
                        <p className="text-xl text-white/90">Together we make a difference</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-3 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="text-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                            >
                                <motion.div
                                    className="text-6xl font-bold mb-2"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 + index * 0.2 }}
                                >
                                    {stat.value}
                                </motion.div>
                                <p className="text-xl text-white/90">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-gradient-to-r from-eco-green to-leaf-green text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-6 text-white">Start Recycling Today!</h2>
                        <p className="text-xl mb-8 text-white/90">
                            Join hundreds of families in Teresa, Sta. Mesa making a positive impact on the environment.
                        </p>
                        <Button
                            variant="outline"
                            className="bg-white text-eco-green hover:bg-light-gray border-0"
                            onClick={() => onNavigate('find')}
                        >
                            Launch App
                        </Button>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}