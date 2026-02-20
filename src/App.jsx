import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Page Imports
import Welcome from './Welcome';
import About from "./About"
// Placeholders for the next steps

import Game from "./Interactive"

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Welcome />} />
     <Route path="/about" element={<About />} />
        <Route path="/game" element={<Game />} /> 
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="bg-[#020605] min-h-screen font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      <Router>
        <AnimatedRoutes />
      </Router>
    </div>
  );
}