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
  MessageSquare,
  Home
} from "lucide-react";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 w-full bg-gradient-to-r from-blue-700 to-blue-800 shadow-xl">
      <div className="flex items-center justify-between py-2 px-2 sm:px-4 w-full">
        {/* Left Side - Logo and Title */}
       <div className="flex items-center min-w-0">
  <Link to="/" className="flex items-center flex-shrink-0">
    <img
      src="/favicon.webp"
      alt="Police Triangle Logo"
      className="w-10 h-10 object-cover border-2 border-blue-300 shadow-lg"
      style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
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
            <CompactNavItem to="/Investigator/Home" icon={Home} text="Home" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/Search/DB" icon={Search} text="SearchDB" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/PendingFir" icon={FileText} text="NewFIR" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/RunningFir" icon={Briefcase} text="Active" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/SolvedFir" icon={CheckCircle} text="Solved" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/UnSolvedFir" icon={CheckCircle} text="Unsolved" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/RejectedFir" icon={CheckCircle} text="Rejected" setMenuOpen={setMenuOpen} />
            <CompactNavItem to="/Investigator/Profile" icon={User} text="Profile" setMenuOpen={setMenuOpen} />
            <div className="relative">
              <CompactChatLink setMenuOpen={setMenuOpen} />
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

          {/* Mobile Menu Button - Always visible on mobile */}
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
                <CompactNavItem to="/Investigator/Home" icon={Home} text="Home" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/Search/DB" icon={Search} text="Search DB" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/PendingFir" icon={FileText} text="New FIR" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/RunningFir" icon={Briefcase} text="Active Cases" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/SolvedFir" icon={CheckCircle} text="Solved Cases" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/UnSolvedFir" icon={CheckCircle} text="Unsolved Cases" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/RejectedFir" icon={CheckCircle} text="Rejected Cases" mobile setMenuOpen={setMenuOpen} />
                <CompactNavItem to="/Investigator/Profile" icon={User} text="Profile" mobile setMenuOpen={setMenuOpen} />
                <div className="relative">
                  <CompactChatLink mobile setMenuOpen={setMenuOpen} />
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

// Compact Nav Item Component
const CompactNavItem = ({ to, icon: Icon, text, mobile = false, setMenuOpen }) => (
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
const CompactChatLink = ({ mobile = false, setMenuOpen }) => (
  <Link
    to="/investigator/Chat"
    className={`flex items-center ${mobile ? 'px-4 py-3' : 'px-3 py-2'} rounded-lg bg-blue-600/30 hover:bg-blue-600/50 transition-colors text-white relative`}
    onClick={() => mobile && setMenuOpen(false)}
  >
    <MessageSquare size={18} className="mr-2" />
    <span className="text-sm">Chat</span>
  </Link>
);

export default Header;