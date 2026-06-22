import { Target, Lightbulb, Users, Heart, BookOpen, Recycle } from 'lucide-react';

function StaticCard({ children, className = '' }) {
  return (
    <div className={`min-w-0 overflow-hidden bg-white rounded-[16px] p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function AboutPage({ onNavigate }) {
  const mission = {
    problem: {
      icon: Target,
      title: 'The Problem',
      description: 'Many residents in Teresa, Sta. Mesa lack access to information about recyclable materials, their current prices, and locations of trusted junkshops. This leads to missed opportunities for income generation and environmental impact.',
      points: [
        'Limited awareness of recyclable materials value',
        'Difficulty finding nearby junkshops',
        'Lack of standardized pricing information',
        'Inefficient waste management practices'
      ]
    },
    solution: {
      icon: Lightbulb,
      title: 'Our Solution',
      description: 'JunkShop On-The-Go provides a comprehensive digital platform that empowers residents with the knowledge and tools to recycle effectively, earn income, and contribute to environmental sustainability.',
      points: [
        'Real-time price guide for recyclables',
        'Interactive junkshop locator with maps',
        'Educational recycling guidelines',
        'Community-driven information sharing'
      ]
    }
  };

  const benefits = [
    {
      icon: Users,
      title: 'Community Empowerment',
      description: 'Enable residents to make informed decisions about recycling and turn waste into income opportunities.',
      color: 'bg-eco-green'
    },
    {
      icon: Recycle,
      title: 'Environmental Impact',
      description: 'Reduce waste in landfills and promote sustainable practices within the community.',
      color: 'bg-leaf-green'
    },
    {
      icon: Heart,
      title: 'Social Responsibility',
      description: 'Build a culture of environmental consciousness and collective action for a cleaner Teresa, Sta. Mesa.',
      color: 'bg-clean-blue'
    }
  ];

  const theories = [
    {
      title: 'Environmental Education Theory',
      description: 'Our platform is grounded in environmental education principles, providing accessible information to increase awareness and promote behavioral change toward sustainable practices.',
      keyPoints: [
        'Knowledge building through accessible information',
        'Skill development for proper recycling',
        'Attitude formation toward environmental responsibility',
        'Action-oriented approach to waste management'
      ]
    },
    {
      title: 'Community-Based Systems Theory',
      description: 'We recognize that effective recycling requires community participation and local knowledge. Our approach integrates local junkshops, residents, and environmental practices into a cohesive system.',
      keyPoints: [
        'Local stakeholder engagement',
        'Community-driven information sharing',
        'Sustainable livelihood opportunities',
        'Social and environmental interconnections'
      ]
    }
  ];

  const team = [
    { name: 'Project Lead', role: 'Community Organizer' },
    { name: 'Tech Developer', role: 'Web Developer' },
    { name: 'Research Coordinator', role: 'Environmental Researcher' },
    { name: 'Community Liaison', role: 'Local Resident Representative' }
  ];

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Hero */}
      <section className="bg-gradient-to-br from-eco-green via-leaf-green to-clean-blue text-white py-20 pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h1 className="mb-6 text-white">Our Mission</h1>
            <p className="text-lg sm:text-2xl text-white/90 mb-8">
              Empowering the Teresa, Sta. Mesa community through accessible recycling information and sustainable practices
            </p>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full max-w-full">
              <Recycle className="text-white shrink-0" size={24} />
              <span className="text-sm sm:text-xl text-center">Community-Centered • Eco-Friendly • Accessible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Problem */}
            <div>
              <StaticCard className="h-full bg-red-50 border-2 border-red-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                  <div className="bg-red-500 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0">
                    <mission.problem.icon className="text-white" size={32} />
                  </div>
                  <h2 className="text-red-700">{mission.problem.title}</h2>
                </div>

                <p className="text-gray-700 mb-6">{mission.problem.description}</p>

                <div className="space-y-3">
                  {mission.problem.points.map((point, index) => (
                    <div key={index} className="flex min-w-0 items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0" />
                      <p className="min-w-0 flex-1 break-words text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </StaticCard>
            </div>

            {/* Solution */}
            <div>
              <StaticCard className="h-full bg-eco-green/5 border-2 border-eco-green">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                  <div className="bg-eco-green w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0">
                    <mission.solution.icon className="text-white" size={32} />
                  </div>
                  <h2 className="text-eco-green">{mission.solution.title}</h2>
                </div>

                <p className="text-gray-700 mb-6">{mission.solution.description}</p>

                <div className="space-y-3">
                  {mission.solution.points.map((point, index) => (
                    <div key={index} className="flex min-w-0 items-start gap-3">
                      <div className="w-2 h-2 bg-eco-green rounded-full mt-2 shrink-0" />
                      <p className="min-w-0 flex-1 break-words text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </StaticCard>
            </div>
          </div>
        </div>
      </section>

      {/* Community Benefits */}
      <section className="py-16 bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Community Benefits</h2>
            <p className="text-xl text-gray-600">How we make a difference together</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <StaticCard key={index}>
                <div
                  className={`${benefit.color} w-16 h-16 rounded-full flex items-center justify-center mb-4`}
                >
                  <benefit.icon className="text-white" size={32} />
                </div>
                <h3 className="mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </StaticCard>
            ))}
          </div>
        </div>
      </section>

      {/* Research Foundation */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <BookOpen className="text-eco-green mx-auto mb-4" size={48} />
            <h2 className="mb-4">Research Foundation</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our approach is grounded in established environmental and community development theories
            </p>
          </div>

          <div className="space-y-8">
            {theories.map((theory, index) => (
              <div key={index}>
                <StaticCard className="min-w-0 overflow-hidden bg-gradient-to-br from-clean-blue/5 to-eco-green/5 border-2 border-eco-green/30">
                  <h3 className="mb-4 text-eco-green">{theory.title}</h3>
                  <p className="text-gray-700 mb-6 break-words">{theory.description}</p>

                  <div className="min-w-0 overflow-hidden bg-white rounded-lg p-4 sm:p-6">
                    <h4 className="text-base mb-4">Key Principles:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {theory.keyPoints.map((point, i) => (
                        <div key={i} className="flex min-w-0 items-start gap-3">
                          <div className="w-6 h-6 bg-eco-green rounded-full flex shrink-0 items-center justify-center">
                            <span className="text-white text-xs font-bold">{i + 1}</span>
                          </div>
                          <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-700 break-words">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </StaticCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gradient-to-br from-sunny-yellow/20 to-eco-green/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaticCard className="text-center">
            <h2 className="mb-6">Our Vision for Teresa, Sta. Mesa</h2>
            <p className="text-xl text-gray-700 mb-8">
              We envision a community where every resident has the knowledge, tools, and motivation
              to participate in sustainable waste management. Through collective action and accessible
              information, we aim to create a cleaner, greener neighborhood while providing economic
              opportunities for families.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-eco-green mb-2">100%</div>
                <p className="text-gray-600">Community Coverage</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-eco-green mb-2">Zero</div>
                <p className="text-gray-600">Recyclable Waste</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-eco-green mb-2">∞</div>
                <p className="text-gray-600">Positive Impact</p>
              </div>
            </div>
          </StaticCard>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Our Team</h2>
            <p className="text-xl text-gray-600">
              Dedicated individuals working for the community
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <StaticCard key={index} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-eco-green to-leaf-green rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-white" size={40} />
                </div>
                <h4 className="mb-2">{member.name}</h4>
                <p className="text-gray-600">{member.role}</p>
              </StaticCard>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-eco-green text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h2 className="mb-6 text-white">Join Our Community Initiative</h2>
            <p className="text-xl text-white/90 mb-8">
              Together, we can create a more sustainable and prosperous Teresa, Sta. Mesa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="bg-white text-eco-green px-8 py-4 rounded-[12px] font-semibold hover:bg-light-gray transition-colors"
              >
                Get Involved
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-[12px] font-semibold hover:bg-white/30 transition-colors"
              >
                Start Recycling
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
