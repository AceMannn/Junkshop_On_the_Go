// src/pages/AboutPage.jsx
import { motion } from "framer-motion"; // changed to framer-motion
import { Target, Lightbulb, Users, Heart, BookOpen, Recycle } from "lucide-react";

// If you don't have a Card component yet, comment it out or use a div wrapper
// import { Card } from "../components/Card";

export default function AboutPage() {
    const mission = {
        problem: {
            icon: Target,
            title: "The Problem",
            description:
                "Many residents in Teresa, Sta. Mesa lack access to information about recyclable materials, their current prices, and locations of trusted junkshops. This leads to missed opportunities for income generation and environmental impact.",
            points: [
                "Limited awareness of recyclable materials value",
                "Difficulty finding nearby junkshops",
                "Lack of standardized pricing information",
                "Inefficient waste management practices",
            ],
        },
        solution: {
            icon: Lightbulb,
            title: "Our Solution",
            description:
                "JunkShop On-The-Go provides a comprehensive digital platform that empowers residents with the knowledge and tools to recycle effectively, earn income, and contribute to environmental sustainability.",
            points: [
                "Real-time price guide for recyclables",
                "Interactive junkshop locator with maps",
                "Educational recycling guidelines",
                "Community-driven information sharing",
            ],
        },
    };

    const benefits = [
        {
            icon: Users,
            title: "Community Empowerment",
            description:
                "Enable residents to make informed decisions about recycling and turn waste into income opportunities.",
            color: "bg-eco-green",
        },
        {
            icon: Recycle,
            title: "Environmental Impact",
            description:
                "Reduce waste in landfills and promote sustainable practices within the community.",
            color: "bg-leaf-green",
        },
        {
            icon: Heart,
            title: "Social Responsibility",
            description:
                "Build a culture of environmental consciousness and collective action for a cleaner Teresa, Sta. Mesa.",
            color: "bg-clean-blue",
        },
    ];

    const theories = [
        {
            title: "Environmental Education Theory",
            description:
                "Our platform is grounded in environmental education principles, providing accessible information to increase awareness and promote behavioral change toward sustainable practices.",
            keyPoints: [
                "Knowledge building through accessible information",
                "Skill development for proper recycling",
                "Attitude formation toward environmental responsibility",
                "Action-oriented approach to waste management",
            ],
        },
        {
            title: "Community-Based Systems Theory",
            description:
                "We recognize that effective recycling requires community participation and local knowledge. Our approach integrates local junkshops, residents, and environmental practices into a cohesive system.",
            keyPoints: [
                "Local stakeholder engagement",
                "Community-driven information sharing",
                "Sustainable livelihood opportunities",
                "Social and environmental interconnections",
            ],
        },
    ];

    const team = [
        { name: "Project Lead", role: "Community Organizer" },
        { name: "Tech Developer", role: "Web Developer" },
        { name: "Research Coordinator", role: "Environmental Researcher" },
        { name: "Community Liaison", role: "Local Resident Representative" },
    ];

    return (
        <div className="pt-20 min-h-screen bg-light-gray">
            {/* Hero */}
            <section className="bg-gradient-to-br from-eco-green via-leaf-green to-clean-blue text-white py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="mb-6 text-white text-4xl font-bold">Our Mission</h1>
                        <p className="text-2xl text-white/90 mb-8">
                            Empowering the Teresa, Sta. Mesa community through accessible recycling
                            information and sustainable practices
                        </p>
                        <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full justify-center mx-auto">
                            <Recycle className="text-white" size={24} />
                            <span className="text-xl">Community-Centered • Eco-Friendly • Accessible</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Problem & Solution */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
                    {/* Problem */}
                    <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                        {/* <Card className="h-full bg-red-50 border-2 border-red-200"> */}
                        <div className="h-full bg-red-50 border-2 border-red-200 p-6 rounded-lg">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center">
                                    <mission.problem.icon className="text-white" size={32} />
                                </div>
                                <h2 className="text-red-700 text-xl font-semibold">{mission.problem.title}</h2>
                            </div>

                            <p className="text-gray-700 mb-6">{mission.problem.description}</p>

                            <div className="space-y-3">
                                {mission.problem.points.map((point, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                        <p className="text-gray-700">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* </Card> */}
                    </motion.div>

                    {/* Solution */}
                    <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                        {/* <Card className="h-full bg-eco-green/5 border-2 border-eco-green"> */}
                        <div className="h-full bg-eco-green/5 border-2 border-eco-green p-6 rounded-lg">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-eco-green w-16 h-16 rounded-full flex items-center justify-center">
                                    <mission.solution.icon className="text-white" size={32} />
                                </div>
                                <h2 className="text-eco-green text-xl font-semibold">{mission.solution.title}</h2>
                            </div>

                            <p className="text-gray-700 mb-6">{mission.solution.description}</p>

                            <div className="space-y-3">
                                {mission.solution.points.map((point, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-eco-green rounded-full mt-2 flex-shrink-0" />
                                        <p className="text-gray-700">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* </Card> */}
                    </motion.div>
                </div>
            </section>

            {/* Community Benefits */}
            <section className="py-16 bg-light-gray">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="mb-4 text-3xl font-bold">Community Benefits</h2>
                        <p className="text-xl text-gray-600">How we make a difference together</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="p-6 bg-white rounded-lg shadow-md text-center">
                                <motion.div
                                    className={`${benefit.color} w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto`}
                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <benefit.icon className="text-white" size={32} />
                                </motion.div>
                                <h3 className="mb-3 font-semibold text-lg">{benefit.title}</h3>
                                <p className="text-gray-600">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
