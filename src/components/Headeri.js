import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Briefcase, CheckCircle, User, Menu } from "lucide-react"; // Import icons

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative flex items-center justify-between p-4 bg-gray-500 shadow-md">
      {/* Logo & Title */}
      <div className="flex items-center space-x-2">
        <img src="/favicon.webp" alt="Logo" className="w-10 h-10 rounded-full" />
        <h1 className="text-lg font-bold text-white">Police Investigation System</h1>
      </div>

      {/* Hamburger Icon for Small Screens */}
      <button 
        className="lg:hidden text-white focus:outline-none" 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <Menu size={28} />
      </button>

      {/* Navigation Links - Desktop */}
      <nav className="hidden lg:flex space-x-6 text-sm font-medium text-white">
        <NavItem to="/Investigator/PendingFir" icon={FileText} text="New FIR" />
        <NavItem to="/Investigator/RunningFir" icon={Briefcase} text="Running Cases" />
        <NavItem to="/Investigator/SolvedFir" icon={CheckCircle} text="Solved Cases" />
        <NavItem to="/Investigator/Profile" icon={User} text="My Profile" />
      </nav>

      {/* Mobile Menu - Slide In from Right */}
      {menuOpen && (
        <div className="absolute top-0 right-0 bg-gray-700 text-white w-auto p-4 space-y-4 shadow-lg z-50 transition-transform transform animate-slide-in">
          <button className="absolute top-2 right-2 text-white" onClick={() => setMenuOpen(false)}>
            ✖
          </button>
          <NavItem to="/Investigator/PendingFir" icon={FileText} text="New FIR" />
          <NavItem to="/Investigator/RunningFir" icon={Briefcase} text="Running Cases" />
          <NavItem to="/Investigator/SolvedFir" icon={CheckCircle} text="Solved Cases" />
          <NavItem to="/Investigator/Profile" icon={User} text="My Profile" />
        </div>
      )}
    </header>
  );
}

// Reusable Navigation Link Component
const NavItem = ({ to, icon: Icon, text }) => (
  <Link 
    to={to} 
    className="flex items-center space-x-2 hover:text-gray-300 transition"
  >
    <Icon size={20} />
    <span>{text}</span>
  </Link>
);

export default Header;
