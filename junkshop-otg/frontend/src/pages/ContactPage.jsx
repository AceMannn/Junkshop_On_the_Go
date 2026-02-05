import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Facebook, MapPin, Phone, Send, MessageCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-6 text-white">Let&apos;s Connect</h1>
            <p className="text-2xl text-white/90">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.a
                key={index}
                href={info.link}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover={true}>
                  <motion.div
                    className={`${info.color} w-12 h-12 rounded-full flex items-center justify-center mb-4`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <info.icon className="text-white" size={24} />
                  </motion.div>
                  <h4 className="text-base mb-2">{info.title}</h4>
                  <p className="text-gray-600 text-sm">{info.content}</p>
                </Card>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <h2 className="mb-6">Send Us a Message</h2>
                
                {isSubmitted ? (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="text-white" size={40} />
                    </div>
                    <h3 className="mb-2 text-eco-green">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for reaching out. We&apos;ll get back to you soon.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
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

                    <Button type="submit" className="w-full flex items-center justify-center">
                      <Send size={20} className="mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </Card>
            </motion.div>

            {/* Community Support */}
            <div className="space-y-8">
              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <h3 className="mb-6">Quick Links</h3>
                  <div className="space-y-3">
                    {quickLinks.map((link, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 p-4 bg-light-gray rounded-[12px] hover:bg-eco-green hover:text-white transition-colors text-left group"
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <link.icon className="text-eco-green group-hover:text-white transition-colors" size={24} />
                        <span>{link.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Community Info */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-eco-green text-charcoal">
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
                </Card>
              </motion.div>

              {/* FAQ Preview */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-sunny-yellow/20 border-2 border-sunny-yellow">
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
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4">Find Us in Teresa, Sta. Mesa</h2>
            <p className="text-xl text-gray-600">
              We serve the entire Teresa, Sta. Mesa community
            </p>
          </motion.div>

          <motion.div
            className="relative h-[400px] bg-gradient-to-br from-clean-blue/20 to-eco-green/20 rounded-[24px] overflow-hidden shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Map mockup */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="text-eco-green mx-auto mb-4" size={64} />
                <h3 className="mb-2">Teresa, Sta. Mesa, Manila</h3>
                <p className="text-gray-600">Interactive Map View</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Media CTA */}
      <section className="py-16 bg-gradient-to-br from-eco-green to-leaf-green text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}