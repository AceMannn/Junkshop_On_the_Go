import { motion } from 'framer-motion';
import {
  Search,
  DollarSign,
  MapPin,
  Leaf,
  Recycle,
  Package,
  Smartphone,
  ShoppingBag
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import garbageCollector from '../assets/garbage_collector.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export default function HomePage({ onNavigate }) {
  // ========================================
  // HOW IT WORKS DATA
  // ========================================
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

  // ========================================
  // RECYCLABLES DATA
  // ========================================
  const recyclables = [
    {
      name: 'PET Bottle',
      image:
        'https://images.unsplash.com/photo-1558640476-437a2b9438a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwYm90dGxlJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: '₱15-20/kg',
      icon: Recycle
    },
    {
      name: 'Scrap Metal',
      image:
        'https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY3JhcCUyMG1ldGFsJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: '₱35-50/kg',
      icon: Package
    },
    {
      name: 'Cardboard',
      image:
        'https://images.unsplash.com/photo-1719600804011-3bff3909b183?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkYm9hcmQlMjBib3hlcyUyMHJlY3ljbGluZ3xlbnwxfHx8fDE3NjUzNjg0MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: '₱8-12/kg',
      icon: Package
    },
    {
      name: 'Glass Bottles',
      image:
        'https://images.unsplash.com/photo-1554208873-4292cf6c952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGJvdHRsZXMlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: '₱3-5/pc',
      icon: Recycle
    },
    {
      name: 'Plastic Bags',
      image:
        'https://images.unsplash.com/photo-1637308101453-2055fda23a65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwYmFncyUyMHdhc3RlfGVufDF8fHx8MTc2NTI4ODkzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: '₱5-8/kg',
      icon: ShoppingBag
    },
    {
      name: 'E-waste',
      image:
        'https://images.unsplash.com/photo-1728610996936-d93900f1886b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwd2FzdGUlMjBld2FzdGV8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: '₱20-100/kg',
      icon: Smartphone
    }
  ];

  // ========================================
  // QUICK RECYCLING TIPS DATA
  // ========================================
  const recyclingSteps = [
    {
      title: 'Clean Bottles',
      icon: '🧼',
      description: 'Rinse containers first to remove dirt, liquid, and leftover residue.'
    },
    {
      title: 'Sort by Type',
      icon: '♻️',
      description: 'Separate plastic, metal, paper, glass, and e-waste properly.'
    },
    {
      title: 'Remove Caps',
      icon: '🔓',
      description: 'Take off lids and caps before bringing items for recycling.'
    },
    {
      title: 'Store Dry',
      icon: '📦',
      description: 'Keep recyclables dry and clean in a box or container.'
    }
  ];

  // ========================================
  // COMMUNITY IMPACT STATS
  // ========================================
  const stats = [
    { label: '+200 families helped', value: '200+' },
    { label: 'Local junkshops supported', value: '15' },
    { label: 'Over 1 ton recycled monthly', value: '1T+' }
  ];

  return (
    <div className="pt-20">
        {/* ========================================
            HERO SECTION
        ======================================== */}
        <section className="relative bg-gradient-to-br from-[#f3fbf4] via-white to-[#e8f7ec] 
                            bg-[radial-gradient(circle_at_10px_10px,rgba(61,163,93,0.08)_3px,transparent_0)] 
                            bg-[size:24px_24px] overflow-hidden">
          {/* Decorative glow backgrounds */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-leaf-green/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-eco-green/10 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
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
                  Identify recyclables, know their value, and find junkshops in Teresa,
                  Sta. Mesa, Manila.
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
                <ImageWithFallback
                  src={garbageCollector}
                  alt="Garbage collector"
                  className="rounded-[24px] shadow-2xl w-full h-auto"
                />
              </motion.div>
            </div>
          </div>
        </section>

      {/* ========================================
            HOW IT WORKS SECTION
          ======================================== */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#f8fcf8] via-white to-[#f2faf4]">
        <div className="absolute top-10 right-10 w-32 h-32 bg-leaf-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-eco-green/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start recycling and turn waste into value.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-[24px] p-8 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <motion.div
                  className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto shadow-md`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <step.icon className="text-white" size={30} />
                </motion.div>

                <h4 className="mb-3 text-charcoal">{step.title}</h4>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
            RECYCLABLE CATALOG SECTION
          ======================================== */}
<section className="py-16 bg-gradient-to-br from-[#f8fcf8] via-white to-[#f2faf4]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="mb-4">What Can You Recycle?</h2>
      <p className="text-xl text-gray-600">
        Popular recyclable materials in your area
      </p>
    </motion.div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {recyclables.map((item, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-[24px] p-5 shadow-md border border-gray-100 transition-all duration-200 will-change-transform"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08, duration: 0.35 }}
          whileHover={{ y: -8 }}
        >
          <div className="relative h-48 mb-4 rounded-[18px] overflow-hidden">
            <ImageWithFallback
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="mb-1">{item.name}</h4>
              <div className="inline-block bg-sunny-yellow px-3 py-1 rounded-lg">
                <span className="font-semibold text-charcoal">{item.price}</span>
              </div>
            </div>

            <item.icon className="text-eco-green shrink-0" size={28} />
          </div>
        </motion.div>
      ))}
    </div>

    <div className="text-center">
      <Button onClick={() => onNavigate('prices')}>View All Recyclables</Button>
    </div>
  </div>
</section>

      {/* ========================================
            JUNKSHOP LOCATOR PREVIEW SECTION
          ======================================== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4">Find Junkshops Near You</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover trusted junkshops in Teresa, Sta. Mesa with real-time pricing and community ratings.
            </p>
          </motion.div>

          {/* Main Card Container */}
          <motion.div
            className="bg-[#f9faf9] rounded-[28px] shadow-lg overflow-hidden border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid lg:grid-cols-2">
              {/* ========================================
                        LEFT SIDE - JUNKSHOP LIST
                  ======================================== */}
              <div className="p-6 sm:p-8 bg-white">
                <div className="space-y-8">
                  {[
                    {
                      name: "Mary Sartoe Junkshop",
                      address: "2.45 Teresa St. Sta. Mesa",
                      distance: "2.3 km away",
                      rating: "★★★★☆",
                      status: "Open now"
                    },
                    {
                      name: "Green Recycle Teresa",
                      address: "Trias St. Sta. Mesa",
                      distance: "1.2 km away",
                      rating: "★★★★☆",
                      status: "Opens 3:00 AM Monday"
                    },
                    {
                      name: "Eco Point Junkshop",
                      address: "Romera St. Sta. Mesa",
                      distance: "3.0 km away",
                      rating: "★★★★☆",
                      status: "Closed"
                    }
                  ].map((shop, index) => (
                    <motion.div
                      key={index}
                      className="flex gap-4 items-start"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.12 }}
                    >
                      {/* Pin + line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-10 h-10 rounded-full bg-eco-green flex items-center justify-center shadow-md">
                          <MapPin className="text-white" size={18} />
                        </div>
                        {index !== 2 && (
                          <div className="w-[2px] h-16 bg-gray-200 mt-2 rounded-full" />
                        )}
                      </div>

                      {/* Shop Info */}
                      <div className="flex-1 pt-1">
                        <h4 className="text-[1.6rem] font-semibold text-charcoal mb-2 leading-snug">
                          {shop.name}
                        </h4>

                        <p className="text-gray-600 text-base mb-2">
                          {shop.address}, <span className="text-gray-700">{shop.distance}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-yellow-500 tracking-wide">{shop.rating}</span>
                          <span className="text-gray-600">{shop.status}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Button */}
                <div className="mt-8">
                  <Button onClick={() => onNavigate('find')}>
                    Open Full Map
                  </Button>
                </div>
              </div>

              {/* ========================================
                    RIGHT SIDE - ACTUAL GOOGLE MAP
                  ======================================== */}
              <div className="relative min-h-[320px] lg:min-h-full bg-[#eef5ef]">
                <iframe
                  title="Sta. Mesa Junkshop Map"
                  src="https://www.google.com/maps?q=Teresa%20Sta.%20Mesa%20Manila&z=16&output=embed"
                  className="w-full h-full min-h-[320px] lg:min-h-[500px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Floating info card */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-[20px] shadow-xl px-5 py-4 w-[88%] max-w-[340px] border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-eco-green/10 flex items-center justify-center shrink-0">
                      <MapPin className="text-eco-green" size={20} />
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-charcoal leading-snug">
                        Sta. Mesa, Manila
                      </h4>
                      <p className="text-sm text-gray-600">
                        1.2km away, open now
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================
          QUICK RECYCLING TIPS SECTION
      ======================================== */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#eef9f1] via-white to-[#f4fbf5]">
        {/* Soft eco glow backgrounds */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-eco-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-leaf-green/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >

            <h2 className="mb-4">Quick Recycling Tips</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to prepare your recyclables properly before
              bringing them to a junkshop.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {recyclingSteps.map((step, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-[24px] p-8 text-center shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <div className="text-5xl mb-5">{step.icon}</div>
                <h4 className="mb-3 text-charcoal">{step.title}</h4>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button onClick={() => onNavigate('guide')}>View Full Guide</Button>
          </div>
        </div>
      </section>

      {/* ========================================
          COMMUNITY IMPACT SECTION
      ======================================== */}
      <section className="py-16 bg-eco-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
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
                  className="text-5xl font-bold mb-2"
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

      {/* ========================================
          FINAL CALL TO ACTION SECTION
      ======================================== */}
      <section className="py-16 bg-gradient-to-r from-eco-green to-leaf-green text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-white">Start Recycling Today!</h2>

            <p className="text-xl mb-8 text-white/90">
              Join hundreds of families in Teresa, Sta. Mesa making a positive
              impact on the environment.
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