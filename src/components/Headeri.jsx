import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Briefcase,
  CheckCircle,
  User,
  Menu,
  Search,
  X,
  MessageSquare
} from "lucide-react";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Define navigation items
  const navItems = [
    { to: "/Investigator/Search/DB", icon: Search, text: "SearchDB" },
    { to: "/Investigator/PendingFir", icon: FileText, text: "NewFIR" },
    { to: "/Investigator/RunningFir", icon: Briefcase, text: "Active" },
    { to: "/Investigator/SolvedFir", icon: CheckCircle, text: "Solved" },
    { to: "/Investigator/UnSolvedFir", icon: CheckCircle, text: "Unsolved" },
    { to: "/Investigator/RejectedFir", icon: CheckCircle, text: "Rejected" },
    { to: "/Investigator/Profile", icon: User, text: "Profile" }
  ];

  // Compact Nav Item Component
  const CompactNavItem = ({ to, icon: Icon, text, mobile = false }) => (
    <Link
      to={to}
      className={`flex items-center ${mobile ? 'px-4 py-3' : 'px-3 py-2'} rounded-lg hover:bg-blue-600/50 transition-colors text-white`}
      onClick={() => mobile && setMenuOpen(false)}
    >
      <Icon size={18} className="mr-2" />
      <span className="text-sm">{text}</span>
    </Link>
  );

  // Compact Chat Link Component
  const CompactChatLink = ({ mobile = false }) => (
    <Link
      to="/investigator/Chat"
      className={`flex items-center ${mobile ? 'px-4 py-3' : 'px-3 py-2'} rounded-lg bg-blue-600/30 hover:bg-blue-600/50 transition-colors text-white relative`}
      onClick={() => mobile && setMenuOpen(false)}
    >
      <MessageSquare size={18} className="mr-2" />
      <span className="text-sm">Chat</span>
    </Link>
  );

  return (
    <header className="relative z-50 w-full bg-gradient-to-r from-blue-700 to-blue-800 shadow-xl">
      <div className="flex items-center justify-between py-2 px-2 sm:px-4 w-full">
        {/* Left Side - Logo and Title */}
        <div className="flex items-center min-w-0">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src="/favicon.webp"
              alt="Police Badge Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-blue-300 shadow-lg"
            />
            <h1 className="ml-2 text-sm sm:text-base md:text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis text-white">
              Police Investigation System
            </h1>
          </Link>
        </div>

        {/* Right Side - All Navigation Items */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <CompactNavItem 
                key={item.to}
                to={item.to}
                icon={item.icon}
                text={item.text}
              />
            ))}
            <div className="relative">
              <CompactChatLink />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse border border-white transform translate-x-1 -translate-y-1"></span>
            </div>
          </nav>

          {/* Mobile Search and New FIR - Hidden on desktop */}
          <div className="flex md:hidden items-center space-x-1">
            <Link 
              to="/Investigator/Search/DB" 
              className="p-1 rounded-lg hover:bg-blue-600/50 transition-colors text-white"
              aria-label="Search"
            >
              <Search size={20} />
            </Link>
            <Link 
              to="/Investigator/PendingFir" 
              className="p-1 rounded-lg hover:bg-blue-600/50 transition-colors text-white"
              aria-label="New FIR"
            >
              <FileText size={20} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white focus:outline-none p-1 rounded-full hover:bg-blue-600 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={20} className="text-blue-100" />
            ) : (
              <Menu size={20} className="text-blue-100" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 md:hidden backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-4/5 bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-2xl p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 border-b border-blue-600 pb-4">
                <span className="text-lg font-bold">Menu</span>
                <button 
                  onClick={() => setMenuOpen(false)} 
                  className="p-1 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <X size={20} className="text-blue-100" />
                </button>
              </div>

              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <CompactNavItem 
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    text={item.text}
                    mobile
                  />
                ))}
                <div className="relative">
                  <CompactChatLink mobile />
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 animate-pulse border border-white"></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;