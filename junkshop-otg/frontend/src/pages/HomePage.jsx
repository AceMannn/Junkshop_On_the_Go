// src/pages/HomePage.jsx
import React from "react";
import { motion } from "motion/react";
// Comment out icons/components you might not have yet
// import { Search, DollarSign, MapPin, Leaf, Recycle, Package, Trash2, Smartphone, ShoppingBag, CheckCircle2 } from 'lucide-react';
// import { Button } from "../Button";
// import { Card } from "../Card";
// import { ImageWithFallback } from "../figma/ImageWithFallback";

export function HomePage({ onNavigate }) {
    const howItWorks = [
        {
            // icon: Search, // comment if icon not imported
            title: "Search Recyclables",
            description: "Identify what materials you can recycle",
            color: "bg-eco-green",
        },
        {
            // icon: DollarSign,
            title: "Check Prices",
            description: "Know the current market value",
            color: "bg-sunny-yellow",
        },
        {
            // icon: MapPin,
            title: "Locate Junkshop",
            description: "Find the nearest junkshop",
            color: "bg-clean-blue",
        },
        {
            // icon: Leaf,
            title: "Earn & Recycle",
            description: "Turn trash into cash sustainably",
            color: "bg-leaf-green",
        },
    ];

    const recyclables = [
        {
            name: "PET Bottle",
            image: "https://images.unsplash.com/photo-1558640476-437a2b9438a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
            price: "₱15-20/kg",
            // icon: Recycle,
        },
        {
            name: "Scrap Metal",
            image: "https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
            price: "₱35-50/kg",
            // icon: Package,
        },
        // Add other recyclables here
    ];

    const recyclingSteps = [
        { title: "Clean bottles", icon: "🧼" },
        { title: "Sort by type", icon: "♻️" },
        { title: "Remove caps", icon: "🔓" },
        { title: "Store dry recyclables", icon: "📦" },
    ];

    const stats = [
        { label: "+200 families helped", value: "200+" },
        { label: "Local junkshops supported", value: "15" },
        { label: "Over 1 ton recycled monthly", value: "1T+" },
    ];

    return (
        <div className="pt-20">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-light-gray to-white overflow-hidden">
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
                                <Button onClick={() => onNavigate("find")}>
                                    Find Junkshop Near Me
                                </Button>
                                <Button variant="outline" onClick={() => onNavigate("prices")}>
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
                            {/* Image fallback commented */}
                            {/* <ImageWithFallback src="https://images.unsplash.com/photo..." alt="Community cleaning" className="rounded-[24px] shadow-2xl w-full h-auto" /> */}
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
                                    {/* step.icon ? <step.icon className="text-white" size={32} /> : null */}
                                    <span className="text-white text-2xl">🏷️</span>
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
                                    {/* <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" /> */}
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span>Image</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="mb-1">{item.name}</h4>
                                        <div className="inline-block bg-sunny-yellow px-3 py-1 rounded-lg">
                                            <span className="font-semibold text-charcoal">{item.price}</span>
                                        </div>
                                    </div>
                                    {/* item.icon ? <item.icon className="text-eco-green" size={32} /> : null */}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center">
                        <Button onClick={() => onNavigate("prices")}>View All Recyclables</Button>
                    </div>
                </div>
            </section>

            {/* Other sections (Junkshop Locator, Recycling Guide, Community Impact, Final CTA) can follow same commenting pattern */}
        </div>
    );
}
