import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import FindJunkshopPage from './pages/FindJunkshopPage';
import PricesPage from './pages/PricesPage';
import RecyclingGuidePage from './pages/RecyclingGuidePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginScreen from './components/LoginScreen';
import ProviderDashboard from './components/ProviderDashboard';
import CustomerDashboard from './components/CustomerDashboard';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProviderMode, setIsProviderMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Initial materials data
  const [materials, setMaterials] = useState([
    { id: '1', name: 'PET Bottles (Clear)', category: 'plastic', price: 15, unit: 'kg', available: true },
    { id: '2', name: 'Cardboard', category: 'paper', price: 8, unit: 'kg', available: true },
    { id: '3', name: 'Aluminum Cans', category: 'metal', price: 45, unit: 'kg', available: true },
    { id: '4', name: 'Newspapers', category: 'paper', price: 5, unit: 'kg', available: true },
    { id: '5', name: 'Scrap Metal', category: 'metal', price: 20, unit: 'kg', available: true },
    { id: '6', name: 'Glass Bottles', category: 'glass', price: 3, unit: 'kg', available: true },
    { id: '7', name: 'Office Paper', category: 'paper', price: 7, unit: 'kg', available: true },
    { id: '8', name: 'Plastic Bags (HDPE)', category: 'plastic', price: 10, unit: 'kg', available: true },
  ]);

  const handleNavigate = (section) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomerLogin = () => {
    setIsAuthenticated(true);
    setIsProviderMode(false);
    setShowLoginModal(false);
  };

  const handleProviderLogin = () => {
    setIsAuthenticated(true);
    setIsProviderMode(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsProviderMode(false);
    setActiveSection('home');
  };

  const handleUpdateMaterials = (updatedMaterials) => {
    setMaterials(updatedMaterials);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setActiveSection(hash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when section changes
  useEffect(() => {
    if (isAuthenticated && !isProviderMode) {
      window.history.pushState(null, '', `#${activeSection}`);
    }
  }, [activeSection, isAuthenticated, isProviderMode]);

  // Disable body scroll when login modal is open
  useEffect(() => {
    if (showLoginModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLoginModal]);

  // Show provider dashboard if logged in as provider
  if (isAuthenticated && isProviderMode) {
    return (
      <ProviderDashboard
        onLogout={handleLogout}
        materials={materials}
        onUpdateMaterials={handleUpdateMaterials}
      />
    );
  }

  // Show customer dashboard if logged in as customer
  if (isAuthenticated && !isProviderMode) {
    return (
      <CustomerDashboard
        onLogout={handleLogout}
      />
    );
  }

  // Customer view with header and footer
  const renderPage = () => {
    switch (activeSection) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'find':
        return <FindJunkshopPage />;
      case 'prices':
        return <PricesPage materials={materials} />;
      case 'guide':
        return <RecyclingGuidePage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        onShowLogin={() => setShowLoginModal(true)}
      />
      <main>
        {renderPage()}
      </main>
      <Footer onNavigate={handleNavigate} />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop - no blur */}
          <div 
            className="absolute inset-0 bg-transparent"
            onClick={() => setShowLoginModal(false)}
          />
          {/* Modal Content */}
          <div className="relative z-10">
            <LoginScreen
              onCustomerLogin={handleCustomerLogin}
              onProviderLogin={handleProviderLogin}
              onClose={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
