import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import logoImage from '../assets/junkshop-logo.png';
import { siteContainerClass, siteFooterShellClass } from './ui/siteUi';

export default function Footer({ onNavigate }) {
  const linkClass =
    'text-zinc-400 hover:text-emerald-400 transition-colors text-sm text-left';
  const contactIconClass = 'shrink-0 mt-0.5 text-emerald-500';

  return (
    <footer className={`${siteFooterShellClass} py-14 sm:py-16`}>
      <div className={siteContainerClass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4">
            <img src={logoImage} alt="JunkShop On-The-Go" className="h-16 w-auto mb-4" />
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              JunkShop On-The-Go connects customers with verified junkshops for pickups,
              drop-offs, price checking, and recycling guidance.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About' },
                { id: 'find-shop', label: 'Find a Shop' },
                { id: 'prices', label: 'Prices' },
                { id: 'guide', label: 'Guide' },
              ].map((section) => (
                <li key={section.id}>
                  <button type="button" onClick={() => onNavigate(section.id)} className={linkClass}>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {[
                { id: 'contact', label: 'Contact Support' },
                { id: 'contact', label: 'Report a Problem' },
                { id: 'contact', label: 'Help Center' },
              ].map((section, index) => (
                <li key={`${section.label}-${index}`}>
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
                <Mail size={16} className={contactIconClass} />
                <a href="mailto:hello@junkshop-otg.ph" className={linkClass}>
                  hello@junkshop-otg.ph
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className={contactIconClass} />
                <a href="tel:09123456789" className={linkClass}>
                  0912 345 6789
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className={contactIconClass} />
                <span>Teresa, Sta. Mesa, Manila, Philippines</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={16} className={contactIconClass} />
                <span>Mon-Sat, 8:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </footer>
  );
}
