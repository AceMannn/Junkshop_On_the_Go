// src/App.jsx
import React from "react";
import Navbar from "./components/Navbar";
// Import pages here
// import AboutPage from "./pages/AboutPage";
// import ContactPage from "./pages/ContactPage";
// import FindJunkshopPage from "./pages/FindJunkshopPage"; // <-- newly added page

import "./App.css";

function App() {
  return (
    <div>
      {/* Navbar always on top */}
      <Navbar />

      <main>
        {/* Add your pages here */}
        {/* <AboutPage /> */}
        {/* <ContactPage /> */}
        {/* <FindJunkshopPage /> */} 
      </main>

      {/* Footer can go here */}
      {/* <Footer /> */}
    </div>
  );
}

export default App;
