// src/App.jsx
import React from "react";
//import Header from "./components/Header";
// Import pages here
import AboutPage from "./pages/AboutPage";
// import ContactPage from "./pages/ContactPage";
// import FindJunkshopPage from "./pages/FindJunkshopPage"; // <-- newly added page

import "./styles/global.css";

function App() {
  return (
    <div>
      {/* Header always on top */}
      {/* <Header /> */}

      <main>
        {/* Add your pages here */}
        <AboutPage />
        {/* <ContactPage /> */}
        {/* <FindJunkshopPage /> */}
      </main>

      {/* Footer can go here */}
      {/* <Footer /> */}
    </div>
  );
}

export default App;
