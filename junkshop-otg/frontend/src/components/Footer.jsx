import { Facebook, Mail, Instagram, Box } from 'lucide-react'; // Use Box as temp logo

export default function Footer({ onNavigate }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-charcoal text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Logo & Description */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center mb-4">
                            {/* TEMP LOGO */}
                            <div className="w-16 h-16 bg-light-gray rounded-full flex items-center justify-center">
                                <Box className="text-charcoal" size={32} />
                            </div>
                        </div>
                        <p className="text-gray-300 max-w-md mb-4">
                            Community-driven recycling for Teresa, Sta. Mesa, Manila.
                            Empowering residents to recycle smarter and earn more.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-white hover:text-eco-green transition-colors">
                                <Facebook size={24} />
                            </a>
                            <a href="#" className="text-white hover:text-eco-green transition-colors">
                                <Mail size={24} />
                            </a>
                            <a href="#" className="text-white hover:text-eco-green transition-colors">
                                <Instagram size={24} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            {['home', 'find', 'prices', 'guide'].map((section) => (
                                <li key={section}>
                                    <button
                                        onClick={() => onNavigate(section)}
                                        className="text-gray-300 hover:text-eco-green transition-colors capitalize"
                                    >
                                        {section === 'find'
                                            ? 'Find Junkshop'
                                            : section === 'guide'
                                                ? 'Recycling Guide'
                                                : section}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-4">Contact</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li>Teresa, Sta. Mesa</li>
                            <li>Manila, Philippines</li>
                            <li className="mt-4">
                                <a href="mailto:hello@junkshop-otg.ph" className="hover:text-eco-green transition-colors">
                                    hello@junkshop-otg.ph
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
                    <p>&copy; {currentYear} JunkShop On-The-Go. All rights reserved.</p>
                    <p className="mt-2 text-sm">Built with ♻️ for the community</p>
                </div>
            </div>
        </footer>
    );
}
