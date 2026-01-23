import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Facebook, MapPin, Phone, Send, MessageCircle } from 'lucide-react';
// import { Card } from '../Card'; // Uncomment when Card component is ready
// import { Button } from '../Button'; // Uncomment when Button component is ready

export function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
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
        { icon: Mail, title: 'Email Us', content: 'hello@junkshop-otg.ph', link: 'mailto:hello@junkshop-otg.ph', color: 'bg-clean-blue' },
        { icon: Facebook, title: 'Facebook Page', content: 'JunkShop On-The-Go Teresa', link: '#', color: 'bg-eco-green' },
        { icon: Phone, title: 'Contact Number', content: '0912-345-6789', link: 'tel:09123456789', color: 'bg-sunny-yellow' },
        { icon: MapPin, title: 'Location', content: 'Teresa, Sta. Mesa, Manila', link: '#', color: 'bg-leaf-green' }
    ];

    const quickLinks = [
        { label: 'Report an Issue', icon: MessageCircle },
        { label: 'Suggest a Junkshop', icon: MapPin },
        { label: 'Update Prices', icon: Send },
        { label: 'Community Feedback', icon: MessageCircle }
    ];

    return (
        <div className="pt-20 min-h-screen bg-light-gray">
            {/* Hero */}
            <section className="bg-gradient-to-br from-clean-blue via-eco-green to-leaf-green text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="mb-6 text-white">Let&apos;s Connect</h1>
                        <p className="text-2xl text-white/90">Have questions, suggestions, or feedback? We&apos;d love to hear from you!</p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-16 bg-white">
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
                                {/* <Card hover={true}> */}
                                <motion.div
                                    className={`${info.color} w-14 h-14 rounded-full flex items-center justify-center mb-4`}
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <info.icon className="text-white" size={28} />
                                </motion.div>
                                <h4 className="text-base mb-2">{info.title}</h4>
                                <p className="text-gray-600 text-sm">{info.content}</p>
                                {/* </Card> */}
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
                        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                            {/* <Card> */}
                            <h2 className="mb-6">Send Us a Message</h2>

                            {isSubmitted ? (
                                <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="text-white" size={40} />
                                    </div>
                                    <h3 className="mb-2 text-eco-green">Message Sent!</h3>
                                    <p className="text-gray-600">Thank you for reaching out. We&apos;ll get back to you soon.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold mb-2 text-charcoal">Name</label>
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
                                        <label htmlFor="email" className="block text-sm font-semibold mb-2 text-charcoal">Email</label>
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
                                        <label htmlFor="message" className="block text-sm font-semibold mb-2 text-charcoal">Message</label>
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

                                    {/* <Button type="submit" className="w-full flex items-center justify-center">
                      <Send size={20} className="mr-2" />
                      Send Message
                    </Button> */}
                                </form>
                            )}
                            {/* </Card> */}
                        </motion.div>

                        {/* Community Support */}
                        <div className="space-y-8">
                            {/* Quick Links */}
                            {/* ... similar commenting can be applied here ... */}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
