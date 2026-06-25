import { Target, Lightbulb, Users, Heart, BookOpen, Recycle } from 'lucide-react';
import SiteSectionHeader from '../components/ui/SiteSectionHeader';
import SiteButton from '../components/ui/SiteButton';
import {
  siteCardClass,
  siteCardHoverClass,
  siteContainerClass,
  siteHeroGradientClass,
  sitePageClass,
  siteSectionPadClass,
} from '../components/ui/siteUi';

function StaticCard({ children, className = '' }) {
  return (
    <div className={`${siteCardClass} p-5 sm:p-6 ${className}`}>
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
    <div className={sitePageClass}>
      <section className={`${siteHeroGradientClass} text-[#191c1c] pt-28 sm:pt-32 pb-16 sm:pb-20`}>
        <div className={`${siteContainerClass} text-center relative z-10`}>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#154212] mb-4">
            Our mission
          </p>
          <h1 className="mb-6">Building a greener Teresa, Sta. Mesa</h1>
          <p className="text-lg sm:text-xl text-[#72796e] mb-8 max-w-2xl mx-auto leading-relaxed">
            Empowering the community through accessible recycling information and sustainable
            practices
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm border border-emerald-200/60 px-4 sm:px-6 py-3 rounded-2xl shadow-sm max-w-full">
            <Recycle className="text-[#154212] shrink-0" size={22} />
            <span className="text-sm sm:text-base font-semibold text-[#42493e] text-center">
              Community-Centered · Eco-Friendly · Accessible
            </span>
          </div>
        </div>
      </section>

      <section className={`${siteSectionPadClass} bg-white`}>
        <div className={siteContainerClass}>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Problem */}
            <div>
              <StaticCard className="h-full bg-red-50/80 border-red-200">
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
              <StaticCard className="h-full bg-emerald-50/80 border-emerald-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                  <div className="bg-[#154212] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0">
                    <mission.solution.icon className="text-white" size={32} />
                  </div>
                  <h2 className="text-[#154212]">{mission.solution.title}</h2>
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

      <section className={`${siteSectionPadClass} site-page-bg`}>
        <div className={siteContainerClass}>
          <SiteSectionHeader
            title="Community Benefits"
            description="How we make a difference together"
          />

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <StaticCard key={index} className={siteCardHoverClass}>
                <div
                  className={`${benefit.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}
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

      <section className={`${siteSectionPadClass} bg-white`}>
        <div className={siteContainerClass}>
          <SiteSectionHeader
            eyebrow="Research"
            title="Research Foundation"
            description="Our approach is grounded in established environmental and community development theories"
          />

          <div className="space-y-8">
            {theories.map((theory, index) => (
              <div key={index}>
                <StaticCard className="bg-gradient-to-br from-blue-50/50 to-emerald-50/50 border-emerald-200/60">
                  <h3 className="mb-4 text-[#154212]">{theory.title}</h3>
                  <p className="text-gray-700 mb-6 break-words">{theory.description}</p>

                  <div className="min-w-0 overflow-hidden bg-white rounded-lg p-4 sm:p-6">
                    <h4 className="text-base mb-4">Key Principles:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {theory.keyPoints.map((point, i) => (
                        <div key={i} className="flex min-w-0 items-start gap-3">
                          <div className="w-6 h-6 bg-[#154212] rounded-lg flex shrink-0 items-center justify-center">
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

      <section className={`${siteSectionPadClass} site-page-bg`}>
        <div className={`${siteContainerClass} max-w-4xl`}>
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
                <div className="text-4xl font-bold text-[#154212] mb-2">100%</div>
                <p className="text-gray-600">Community Coverage</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#154212] mb-2">Zero</div>
                <p className="text-gray-600">Recyclable Waste</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#154212] mb-2">∞</div>
                <p className="text-gray-600">Positive Impact</p>
              </div>
            </div>
          </StaticCard>
        </div>
      </section>

      <section className={`${siteSectionPadClass} bg-white`}>
        <div className={siteContainerClass}>
          <SiteSectionHeader
            title="Our Team"
            description="Dedicated individuals working for the community"
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <StaticCard key={index} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#154212] to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-white" size={40} />
                </div>
                <h4 className="mb-2">{member.name}</h4>
                <p className="text-gray-600">{member.role}</p>
              </StaticCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#154212] text-white">
        <div className={`${siteContainerClass} max-w-4xl text-center`}>
          <div>
            <h2 className="mb-6 text-white">Join Our Community Initiative</h2>
            <p className="text-lg sm:text-xl text-emerald-100/90 mb-8 leading-relaxed">
              Together, we can create a more sustainable and prosperous Teresa, Sta. Mesa
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SiteButton
                variant="secondary"
                className="bg-white text-[#154212] hover:bg-emerald-50 border-0"
                onClick={() => onNavigate('contact')}
              >
                Get Involved
              </SiteButton>
              <SiteButton
                variant="ghost"
                className="text-white border border-white/30 hover:bg-white/10 hover:text-white"
                onClick={() => onNavigate('home')}
              >
                Start Recycling
              </SiteButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
