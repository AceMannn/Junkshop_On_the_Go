import { useState, useEffect } from 'react';
import { Menu, X, LogIn, User } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import logoImage from '../assets/junkshop-logo.png';
import {
  siteContainerClass,
  siteHeaderShellClass,
} from './ui/siteUi';

const headerAuthBtnClass =
  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full transition-all';

export default function Header({
  activeSection,
  onNavigate,
  isAuthenticated = false,
  onShowLogin,
  onShowSignUp,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      const currentScrollY = window.scrollY;

      if (!isDesktop) {
        setHeaderVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <Motion.header
      className={siteHeaderShellClass}
      initial={{ y: -100 }}
      animate={{ y: headerVisible ? 0 : -120 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={siteContainerClass}>
        <div className="flex items-center justify-between h-[4.25rem] sm:h-20">
          <Motion.button
            type="button"
            className="flex items-center cursor-pointer bg-transparent border-0 p-0"
            onClick={() => onNavigate('home')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={logoImage}
              alt="JunkShop On-The-Go"
              className="h-10 sm:h-11 w-auto max-w-[10rem] sm:max-w-none"
            />
          </Motion.button>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                label={item.label}
                isActive={activeSection === item.id}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {!isAuthenticated && onShowLogin && (
              <button
                type="button"
                onClick={onShowLogin}
                className={`${headerAuthBtnClass} text-[#42493e] hover:bg-emerald-50 hover:text-[#154212]`}
              >
                Login
                <LogIn size={18} />
              </button>
            )}
            {!isAuthenticated && onShowSignUp && (
              <button
                type="button"
                onClick={onShowSignUp}
                className={`${headerAuthBtnClass} bg-[#154212] text-white hover:bg-emerald-900 shadow-sm`}
              >
                Sign Up
                <User size={18} />
              </button>
            )}
          </div>

          <button
            className="lg:hidden flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#191c1c] hover:bg-zinc-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <Motion.div
            className="lg:hidden border-t border-zinc-200 bg-white"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className={`${siteContainerClass} py-4 space-y-1`}>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-[#154212] ring-1 ring-emerald-200'
                        : 'text-[#42493e] hover:bg-zinc-50'
                    }`}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
              {!isAuthenticated && onShowLogin && (
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-[#42493e] hover:bg-zinc-50 border-t border-zinc-100 mt-2 pt-4"
                  onClick={() => {
                    onShowLogin();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </button>
              )}
              {!isAuthenticated && onShowSignUp && (
                <button
                  type="button"
                  className={`${headerAuthBtnClass} w-full justify-center mt-3 bg-[#154212] text-white hover:bg-emerald-900 shadow-sm`}
                  onClick={() => {
                    onShowSignUp();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </button>
              )}
            </nav>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.header>
  );
}

function NavLink({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      className="relative text-[#42493e] hover:text-[#154212] transition-colors py-2 text-sm font-semibold"
      onClick={onClick}
    >
      {label}
      <span
        className={`absolute bottom-0 left-0 h-0.5 bg-[#154212] transition-all duration-300 ${
          isActive ? 'w-full' : 'w-0'
        }`}
      />
    </button>
  );
}
