import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Briefcase, CheckCircle, User, Menu } from "lucide-react";

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
      <nav className="hidden lg:flex space-x-6 text-sm font-medium text-white items-center">
         {/* Chat Button - Desktop */}
        <Link
          to="/investigator/Chat"
          className="flex items-center space-x-1 text-yellow-400 font-semibold hover:text-yellow-300 transition focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 p-2 rounded-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.29-.98l-4.71 1.18 1.18-4.71A9.77 9.77 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-bold text-sm">Chat</span>
        </Link>
        <NavItem to="/Investigator/PendingFir" icon={FileText} text="New FIR" />
        <NavItem to="/Investigator/RunningFir" icon={Briefcase} text="Active Cases" />
        <NavItem to="/Investigator/SolvedFir" icon={CheckCircle} text="Solved Cases" />
        <NavItem to="/Investigator/UnSolvedFir" icon={CheckCircle} text="UnSolved Cases" />
        <NavItem to="/Investigator/RejectedFir" icon={CheckCircle} text="Rejected Cases" />
        <NavItem to="/Investigator/Profile" icon={User} text="My Profile" />
        
       
      </nav>

      {/* Mobile Menu - Slide In from Right */}
      {menuOpen && (
        <div className="absolute top-0 right-0 bg-gray-700 text-white w-auto p-4 space-y-4 shadow-lg z-50 transition-transform transform animate-slide-in">
          <button className="absolute top-2 right-2 text-white" onClick={() => setMenuOpen(false)}>
            ✖
          </button>
    {/* Chat Button - Mobile */}
          <Link
            to="/User/Chat"
            className="flex items-center space-x-1 text-red-600 font-semibold hover:text-red-500 transition focus:ring-2 focus:ring-red-300 focus:ring-offset-2 p-2 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.29-.98l-4.71 1.18 1.18-4.71A9.77 9.77 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-bold text-sm">Chat</span>
          </Link>
          <NavItem to="/Investigator/PendingFir" icon={FileText} text="New FIR" />
          <NavItem to="/Investigator/RunningFir" icon={Briefcase} text="Active Cases" />
          <NavItem to="/Investigator/SolvedFir" icon={CheckCircle} text="Solved Cases" />
          <NavItem to="/Investigator/UnSolvedFir" icon={CheckCircle} text="UnSolved Cases" />
          <NavItem to="/Investigator/RejectedFir" icon={CheckCircle} text="Rejected Cases" />
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
