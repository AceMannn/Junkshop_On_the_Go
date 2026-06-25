import { Facebook, Mail, Instagram, MapPin } from 'lucide-react';
import logoImage from '../assets/junkshop-logo.png';
import { siteContainerClass, siteFooterShellClass } from './ui/siteUi';

export default function Footer({ onNavigate }) {
  const handleSocialClick = (platform) => {
    switch (platform) {
      case 'facebook':
        window.open('https://www.facebook.com/junkshop.otg', '_blank', 'noopener,noreferrer');
        break;
      case 'instagram':
        window.open('https://www.instagram.com/junkshop.otg', '_blank', 'noopener,noreferrer');
        break;
      case 'email':
        window.location.href = 'mailto:hello@junkshop-otg.ph';
        break;
      default:
        break;
    }
  };

  const linkClass =
    'text-zinc-400 hover:text-emerald-400 transition-colors text-sm text-left';

  return (
    <footer className={`${siteFooterShellClass} py-14 sm:py-16`}>
      <div className={siteContainerClass}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-5">
            <img src={logoImage} alt="JunkShop On-The-Go" className="h-12 w-auto mb-4 brightness-0 invert" />
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md mb-6">
              Community-driven recycling for Teresa, Sta. Mesa, Manila. Empowering residents to
              recycle smarter, earn more, and keep our neighborhood clean.
            </p>
            <div className="flex gap-3">
              {[
                { id: 'facebook', icon: Facebook, label: 'Facebook' },
                { id: 'email', icon: Mail, label: 'Email' },
                { id: 'instagram', icon: Instagram, label: 'Instagram' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSocialClick(id)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:bg-[#154212] hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About' },
                { id: 'contact', label: 'Contact' },
              ].map((section) => (
                <li key={section.id}>
                  <button type="button" onClick={() => onNavigate(section.id)} className={linkClass}>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                <span>Teresa, Sta. Mesa, Manila, Philippines</span>
              </li>
              <li>
                <a href="mailto:hello@junkshop-otg.ph" className={linkClass}>
                  hello@junkshop-otg.ph
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} JunkShop On-The-Go. All rights reserved.</p>
          <p className="text-emerald-600/80 font-medium">Recycle smarter. Earn more.</p>
        </div>
      </div>
    </footer>
  );
}
