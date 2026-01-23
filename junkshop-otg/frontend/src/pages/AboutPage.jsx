import { motion } from "motion/react";
import { Target, Lightbulb, Users, Heart, BookOpen, Recycle } from "lucide-react";

/*
  🔴 Card component is NOT CREATED YET
  ❌ Import commented to avoid build/runtime errors

  When ready:
  1. Create Card.jsx in src/components/
  2. Uncomment the import below
*/
// import { Card } from "../components/Card";

export default function AboutPage() {
    const mission = {
        problem: {
            icon: Target,
            title: "The Problem",
            description:
                "Many residents in Teresa, Sta. Mesa lack access to information about recyclable materials, their current prices, and locations of trusted junkshops.",
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
                "JunkShop On-The-Go provides a digital platform that empowers residents with recycling knowledge and tools.",
            points: [
                "Real-time price guide for recyclables",
                "Interactive junkshop locator",
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
                "Enable residents to make informed recycling decisions and earn income.",
            color: "bg-eco-green",
        },
        {
            icon: Recycle,
            title: "Environmental Impact",
            description:
                "Reduce landfill waste and promote sustainable practices.",
            color: "bg-leaf-green",
        },
        {
            icon: Heart,
            title: "Social Responsibility",
            description:
                "Build a culture of environmental awareness and action.",
            color: "bg-clean-blue",
        },
    ];

    const theories = [
        {
            title: "Environmental Education Theory",
            description:
                "Providing accessible information to promote sustainable behavior.",
            keyPoints: [
                "Knowledge building",
                "Skill development",
                "Attitude formation",
                "Action-oriented learning",
            ],
        },
        {
            title: "Community-Based Systems Theory",
            description:
                "Effective recycling requires community participation.",
            keyPoints: [
                "Local engagement",
                "Community-driven data",
                "Sustainable livelihoods",
                "Social impact",
            ],
        },
    ];

    const team = [
        { name: "Project Lead", role: "Community Organizer" },
        { name: "Tech Developer", role: "Web Developer" },
        { name: "Research Coordinator", role: "Environmental Researcher" },
        { name: "Community Liaison", role: "Resident Representative" },
    ];

    return (
        <div className="pt-20 min-h-screen bg-light-gray">
            {/* ================= HERO ================= */}
            <section className="bg-gradient-to-br from-eco-green via-leaf-green to-clean-blue text-white py-20">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="mb-6">Our Mission</h1>
                        <p className="text-2xl mb-8">
                            Empowering Teresa, Sta. Mesa through recycling awareness
                        </p>
                        <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full">
                            <Recycle size={24} />
                            <span>Community • Eco • Accessible</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ================= PROBLEM & SOLUTION ================= */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 px-4">

                    {/* 🔴 Card wrapper commented */}
                    {/* <Card> */}
                    <div className="border-2 border-red-200 bg-red-50 p-6 rounded-xl">
                        <div className="flex gap-4 mb-4">
                            <mission.problem.icon size={32} />
                            <h2>{mission.problem.title}</h2>
                        </div>

                        <p className="mb-4">{mission.problem.description}</p>

                        {mission.problem.points.map((p, i) => (
                            <p key={i}>• {p}</p>
                        ))}
                    </div>
                    {/* </Card> */}

                    {/* <Card> */}
                    <div className="border-2 border-eco-green bg-eco-green/5 p-6 rounded-xl">
                        <div className="flex gap-4 mb-4">
                            <mission.solution.icon size={32} />
                            <h2>{mission.solution.title}</h2>
                        </div>

                        <p className="mb-4">{mission.solution.description}</p>

                        {mission.solution.points.map((p, i) => (
                            <p key={i}>• {p}</p>
                        ))}
                    </div>
                    {/* </Card> */}

                </div>
            </section>

            {/* ================= BENEFITS ================= */}
            <section className="py-16 bg-light-gray">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-4">
                    {benefits.map((b, i) => (
                        // <Card key={i}>
                        <div key={i} className="bg-white p-6 rounded-xl shadow">
                            <div className={`${b.color} w-14 h-14 rounded-full flex items-center justify-center mb-4`}>
                                <b.icon size={28} className="text-white" />
                            </div>
                            <h3>{b.title}</h3>
                            <p>{b.description}</p>
                        </div>
                        // </Card>
                    ))}
                </div>
            </section>

            {/* ================= TEAM ================= */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                    {team.map((m, i) => (
                        // <Card key={i}>
                        <div key={i} className="text-center bg-light-gray p-6 rounded-xl">
                            <Users size={40} className="mx-auto mb-4" />
                            <h4>{m.name}</h4>
                            <p>{m.role}</p>
                        </div>
                        // </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
