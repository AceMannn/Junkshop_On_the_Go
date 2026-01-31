// src/App.jsx
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import HomePage from "./pages/HomePage";
import FindJunkshopPage from "./pages/FindJunkshopPage";
import PricesPage from "./pages/PricesPage";
import RecyclingGuidePage from "./pages/RecyclingGuidePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

import "./styles/global.css";

export default function App() {
  const [activePage, setActivePage] = useState("home");

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage onNavigate={setActivePage} />;

      case "find":
        return <FindJunkshopPage />;

      case "prices":
        return <PricesPage />;

      case "guide":
        return <RecyclingGuidePage />;

      case "about":
        return <AboutPage />;

      case "contact":
        return <ContactPage />;

      default:
        return <HomePage onNavigate={setActivePage} />;
    }
  };

  return (
    <div>
      <Header
        activeSection={activePage}
        onNavigate={setActivePage}
      />

      <main>
        {renderPage()}
      </main>

      <Footer onNavigate={setActivePage} />
    </div>
  );
}
