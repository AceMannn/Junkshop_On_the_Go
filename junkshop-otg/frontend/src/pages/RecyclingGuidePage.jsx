import { motion } from 'motion/react';
import { CheckCircle2, X, Download, Droplet, Scissors, PackageOpen, Trash2, Recycle } from 'lucide-react';
// import { ImageWithFallback } from '../figma/ImageWithFallback'; // Commented out, not ready yet
import { Card } from '../Card';
import { Button } from '../Button';

export function RecyclingGuidePage() {
    const steps = [
        {
            number: 1,
            title: 'Separate Materials',
            description: 'Sort recyclables by type: plastic, paper, metal, and glass',
            icon: PackageOpen,
            color: 'bg-eco-green',
            tips: ['Keep different materials in separate bags', 'Label containers for easy identification']
        },
        {
            number: 2,
            title: 'Clean Bottles & Containers',
            description: 'Rinse out food and liquid residue to prevent contamination',
            icon: Droplet,
            color: 'bg-clean-blue',
            tips: ['Use minimal water when cleaning', 'Let items dry completely before storing']
        },
        {
            number: 3,
            title: 'Remove Caps & Labels',
            description: 'Separate caps, labels, and non-recyclable parts',
            icon: Scissors,
            color: 'bg-sunny-yellow',
            tips: ['Caps are often different plastic types', 'Labels can contaminate the recycling process']
        },
        {
            number: 4,
            title: 'Sort by Category',
            description: 'Group similar materials together for better pricing',
            icon: Recycle,
            color: 'bg-leaf-green',
            tips: ['Bundle cardboard and flatten boxes', 'Keep metals separated by type']
        },
        {
            number: 5,
            title: 'Bring to Junkshop',
            description: 'Deliver your sorted recyclables to nearby junkshops',
            icon: Trash2,
            color: 'bg-eco-green',
            tips: ['Call ahead to confirm accepted materials', 'Bring items during business hours']
        }
    ];

    const dos = [
        'Clean and dry all recyclables before storage',
        'Flatten cardboard boxes to save space',
        'Remove food residue from containers',
        'Sort materials by type',
        'Store in a dry, ventilated area',
        'Bundle newspapers and tie them',
        'Check what materials your local junkshop accepts',
        'Flatten plastic bottles to reduce volume'
    ];

    const donts = [
        'Don\'t mix wet and dry waste',
        'Don\'t include food-contaminated items',
        'Don\'t throw batteries in regular trash',
        'Don\'t burn plastic or rubber materials',
        'Don\'t mix different types of plastic',
        'Don\'t include items with hazardous materials',
        'Don\'t leave recyclables exposed to rain',
        'Don\'t forget to remove metal staples from paper'
    ];

    const materialGuides = [
        {
            material: 'Plastic',
            accepted: ['PET bottles', 'Hard plastic containers', 'Plastic bags', 'Plastic chairs'],
            notAccepted: ['Food-contaminated plastic', 'Styrofoam', 'Plastic with food residue'],
            prep: 'Clean, dry, and flatten when possible'
        },
        {
            material: 'Paper',
            accepted: ['Cardboard', 'Newspapers', 'Office paper', 'Magazines', 'Paper bags'],
            notAccepted: ['Wet paper', 'Wax-coated paper', 'Carbon paper', 'Tissue paper'],
            prep: 'Keep dry, flatten boxes, bundle and tie'
        },
        {
            material: 'Metal',
            accepted: ['Aluminum cans', 'Steel cans', 'Copper wire', 'Brass items', 'Iron scraps'],
            notAccepted: ['Paint cans with residue', 'Pressurized containers', 'Batteries'],
            prep: 'Remove labels, flatten cans, separate by metal type'
        },
        {
            material: 'Glass',
            accepted: ['Clear bottles', 'Colored bottles', 'Glass jars'],
            notAccepted: ['Broken glass', 'Window glass', 'Mirrors', 'Light bulbs'],
            prep: 'Clean, remove caps and labels, keep unbroken'
        }
    ];

    return (
        <div className="pt-20 min-h-screen bg-light-gray">
            {/* Hero */}
            <section className="bg-gradient-to-br from-leaf-green to-eco-green text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="mb-4 text-white">How to Recycle Properly</h2>
                        <p className="text-xl text-white/90 max-w-3xl mx-auto">
                            Follow these simple steps to maximize the value of your recyclables
                            and help protect our environment
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4">5 Simple Steps</h2>
                        <p className="text-xl text-gray-600">Your guide to effective recycling</p>
                    </motion.div>

                    <div className="space-y-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon; // FIXED: convert TSX dynamic component to JSX-compatible
                            return (
                                <motion.div
                                    key={step.number}
                                    className="flex flex-col lg:flex-row gap-6 items-start"
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <div className="flex-shrink-0">
                                        <div className={`${step.color} w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                                            {step.number}
                                        </div>
                                    </div>

                                    <Card className="flex-1 shadow-lg" hover={false}>
                                        <div className="flex items-start gap-4">
                                            <motion.div
                                                className={`${step.color} p-4 rounded-[12px]`}
                                                whileHover={{ rotate: 360 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Icon className="text-white" size={32} />
                                            </motion.div>

                                            <div className="flex-1">
                                                <h3 className="mb-2">{step.title}</h3>
                                                <p className="text-gray-600 mb-4">{step.description}</p>

                                                <div className="bg-light-gray p-4 rounded-lg">
                                                    <p className="font-semibold text-sm mb-2">💡 Tips:</p>
                                                    <ul className="space-y-1">
                                                        {step.tips.map((tip, i) => (
                                                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                                <CheckCircle2 className="text-eco-green flex-shrink-0 mt-0.5" size={16} />
                                                                <span>{tip}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Do's and Don'ts */}
            <section className="py-16 bg-light-gray">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4">Do&apos;s and Don&apos;ts</h2>
                        <p className="text-xl text-gray-600">Best practices for recycling</p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Do's */}
                        <Card className="bg-eco-green/5 border-2 border-eco-green">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-eco-green w-12 h-12 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="text-white" size={28} />
                                </div>
                                <h3 className="text-eco-green">Do&apos;s</h3>
                            </div>

                            <ul className="space-y-3">
                                {dos.map((item, index) => (
                                    <motion.li
                                        key={index}
                                        className="flex items-start gap-3 text-gray-700"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <CheckCircle2 className="text-eco-green flex-shrink-0 mt-1" size={20} />
                                        <span>{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </Card>

                        {/* Don'ts */}
                        <Card className="bg-red-50 border-2 border-red-400">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center">
                                    <X className="text-white" size={28} />
                                </div>
                                <h3 className="text-red-600">Don&apos;ts</h3>
                            </div>

                            <ul className="space-y-3">
                                {donts.map((item, index) => (
                                    <motion.li
                                        key={index}
                                        className="flex items-start gap-3 text-gray-700"
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <X className="text-red-500 flex-shrink-0 mt-1" size={20} />
                                        <span>{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Material-Specific Guides */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="mb-4">Material-Specific Guidelines</h2>
                        <p className="text-xl text-gray-600">What to recycle and how to prepare it</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {materialGuides.map((guide, index) => (
                            <Card key={index} delay={index * 0.1}>
                                <h3 className="mb-6 text-eco-green">{guide.material}</h3>

                                <div className="mb-6">
                                    <h4 className="text-base mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="text-eco-green" size={20} />
                                        Accepted Items
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {guide.accepted.map((item, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 bg-eco-green/10 text-eco-green rounded-lg text-sm"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-base mb-3 flex items-center gap-2">
                                        <X className="text-red-500" size={20} />
                                        Not Accepted
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {guide.notAccepted.map((item, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-sunny-yellow/20 p-4 rounded-lg">
                                    <h4 className="text-base mb-2">Preparation Tips</h4>
                                    <p className="text-sm text-gray-700">{guide.prep}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Downloadable Guide */}
            <section className="py-16 bg-gradient-to-br from-eco-green to-leaf-green text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Download className="mx-auto mb-6 text-white" size={64} />
                        <h2 className="mb-4 text-white">Download Our Complete Guide</h2>
                        <p className="text-xl text-white/90 mb-8">
                            Get a printable PDF with all recycling guidelines and tips for your community
                        </p>
                        <Button
                            variant="outline"
                            className="bg-white text-eco-green hover:bg-light-gray border-0"
                        >
                            Download PDF Guide
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Community Tips */}
            <section className="py-16 bg-light-gray">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="bg-clean-blue/10 border-2 border-clean-blue">
                        <h3 className="mb-6">🌟 Community Tips from Teresa, Sta. Mesa</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-base mb-3">Storage Solutions</h4>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Use separate bins for each material type</li>
                                    <li>• Store in a covered, dry area to prevent moisture</li>
                                    <li>• Compress items to save space</li>
                                    <li>• Schedule regular junkshop visits</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-base mb-3">Maximize Your Earnings</h4>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Clean items thoroughly for better prices</li>
                                    <li>• Separate materials by quality</li>
                                    <li>• Accumulate larger quantities before selling</li>
                                    <li>• Compare prices at different junkshops</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
