import { useState } from 'react';
import { Mail, Facebook, MapPin, Phone, Send, MessageCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { contactApi } from '../services/api';
import JunkshopsMap from '../components/maps/JunkshopsMap';
import { useCatalogJunkshops } from '../hooks/useCatalogData';
import EmptyState from '../components/ui/EmptyState';
import ShopRating from '../components/ui/ShopRating';

function StaticCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-[16px] p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const { shops, loading: shopsLoading } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await contactApi.sendMessage(formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'hello@junkshop-otg.ph',
      link: 'mailto:hello@junkshop-otg.ph',
      color: 'bg-clean-blue'
    },
    {
      icon: Facebook,
      title: 'Facebook Page',
      content: 'JunkShop On-The-Go Teresa',
      link: '#',
      color: 'bg-eco-green'
    },
    {
      icon: Phone,
      title: 'Contact Number',
      content: '0912-345-6789',
      link: 'tel:09123456789',
      color: 'bg-sunny-yellow'
    },
    {
      icon: MapPin,
      title: 'Location',
      content: 'Teresa, Sta. Mesa, Manila',
      link: '#',
      color: 'bg-leaf-green'
    }
  ];

  const quickLinks = [
    { label: 'Report an Issue', icon: MessageCircle },
    { label: 'Suggest a Junkshop', icon: MapPin },
    { label: 'Update Prices', icon: Send },
    { label: 'Community Feedback', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Hero */}
      <section className="bg-gradient-to-br from-clean-blue via-eco-green to-leaf-green text-white py-12 pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h1 className="mb-6 text-white">Let&apos;s Connect</h1>
            <p className="text-2xl text-white/90">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <a key={index} href={info.link}>
                <StaticCard>
                  <div
                    className={`${info.color} w-12 h-12 rounded-full flex items-center justify-center mb-4`}
                  >
                    <info.icon className="text-white" size={24} />
                  </div>
                  <h4 className="text-base mb-2">{info.title}</h4>
                  <p className="text-gray-600 text-sm">{info.content}</p>
                </StaticCard>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="mb-2">Verified Partner Directory</h2>
            <p className="text-gray-600">
              Browse active partner junkshops with ratings and recent customer feedback.
            </p>
          </div>
          {shopsLoading ? (
            <p className="text-gray-500">Loading verified partners...</p>
          ) : shops.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No verified partners yet"
              description="Partner listings appear once providers complete setup and publish their shop."
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {shops.map((shop) => (
                <StaticCard key={shop.id} className="border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="mb-1">{shop.name}</h4>
                      <p className="text-xs text-gray-600">{shop.address}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                      Verified
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <ShopRating shop={shop} />
                    <span className={`text-xs ${shop.status === 'Open' ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {shop.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{shop.phone || 'No contact number yet'}</p>
                  {shop.latestReview && (
                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-700">
                        ★ {shop.latestReview.score} - {shop.latestReview.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(shop.latestReview.createdAt).toLocaleDateString('en-PH')}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {shop.latestReview.comment || 'No written comment.'}
                      </p>
                    </div>
                  )}
                </StaticCard>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <StaticCard>
                <h2 className="mb-6">Send Us a Message</h2>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="text-white" size={40} />
                    </div>
                    <h3 className="mb-2 text-eco-green">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for reaching out. We&apos;ll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="rounded-[12px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold mb-2 text-charcoal">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-[12px] border-2 border-light-gray focus:border-eco-green focus:outline-none transition-colors"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold mb-2 text-charcoal">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-[12px] border-2 border-light-gray focus:border-eco-green focus:outline-none transition-colors"
                        placeholder="Price update, junkshop suggestion, or support request"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold mb-2 text-charcoal">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-[12px] border-2 border-light-gray focus:border-eco-green focus:outline-none transition-colors"
                        placeholder="juan@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold mb-2 text-charcoal">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 rounded-[12px] border-2 border-light-gray focus:border-eco-green focus:outline-none transition-colors resize-none"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center">
                      <Send size={20} className="mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </StaticCard>
            </div>

            {/* Community Support */}
            <div className="space-y-8">
              {/* Quick Links */}
              <div>
                <StaticCard>
                  <h3 className="mb-6">Quick Links</h3>
                  <div className="space-y-3">
                    {quickLinks.map((link, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full flex items-center gap-3 p-4 bg-light-gray rounded-[12px] hover:bg-eco-green hover:text-white transition-colors text-left group"
                      >
                        <link.icon className="text-eco-green group-hover:text-white transition-colors" size={24} />
                        <span>{link.label}</span>
                      </button>
                    ))}
                  </div>
                </StaticCard>
              </div>

              {/* Community Info */}
              <div>
                <StaticCard className="bg-eco-green text-charcoal">
                  <h3 className="mb-4 text-charcoal">Community Support Hours</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">Monday - Friday</p>
                      <p className="text-charcoal/80">9:00 AM - 6:00 PM</p>
                    </div>
                    <div>
                      <p className="font-semibold">Saturday</p>
                      <p className="text-charcoal/80">10:00 AM - 4:00 PM</p>
                    </div>
                    <div>
                      <p className="font-semibold">Sunday</p>
                      <p className="text-charcoal/80">Closed</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-charcoal/20">
                    <p className="text-sm text-charcoal/80">
                      For urgent concerns, please contact us via Facebook Messenger
                      or email, and we&apos;ll respond as soon as possible.
                    </p>
                  </div>
                </StaticCard>
              </div>

              {/* FAQ Preview */}
              <div>
                <StaticCard className="bg-sunny-yellow/20 border-2 border-sunny-yellow">
                  <h3 className="mb-4">Need Help?</h3>
                  <p className="text-gray-700 mb-4">
                    Check out our common questions or reach out to us directly.
                    We&apos;re here to help you make the most of recycling in your community.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• How do I find the nearest junkshop?</li>
                    <li>• What materials can I recycle?</li>
                    <li>• How are prices determined?</li>
                    <li>• How can I suggest a new junkshop?</li>
                  </ul>
                </StaticCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Find Us in Teresa, Sta. Mesa</h2>
            <p className="text-xl text-gray-600">
              We serve the entire Teresa, Sta. Mesa community
            </p>
          </div>

          <div className="rounded-[24px] overflow-hidden shadow-lg border border-gray-100 bg-white p-4">
            {shopsLoading ? (
              <p className="text-center text-gray-500 py-16">Loading partner shops…</p>
            ) : shops.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No partner shops on the map yet"
                description="Verified junkshops in Metro Manila will appear here once providers finish setup."
              />
            ) : (
              <JunkshopsMap shops={shops} routingEnabled />
            )}
          </div>
        </div>
      </section>

      {/* Social Media CTA */}
      <section className="py-16 bg-gradient-to-br from-eco-green to-leaf-green text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h2 className="mb-6 text-white">Join Our Community Online</h2>
            <p className="text-xl text-white/90 mb-8">
              Follow us on social media for updates, tips, and community stories
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                className="bg-white text-eco-green hover:bg-light-gray border-0 flex items-center justify-center"
              >
                <Facebook size={24} className="mr-2" />
                Follow on Facebook
              </Button>
              <Button
                variant="outline"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-0 flex items-center justify-center"
              >
                <Mail size={24} className="mr-2" />
                Subscribe to Newsletter
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
