// src/App.jsx
import React from "react";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import "./App.css";

function App() {
  return (
    <div>
      <Navbar />
      <main>
        <AboutPage />
      </main>
    </div>
  );
}

export default App;
