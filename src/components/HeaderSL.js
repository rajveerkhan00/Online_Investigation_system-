import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, UserPlus, User, Shield } from "lucide-react";

function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <header className="flex items-center justify-between p-4 bg-gray-200 flex-wrap pt-6 relative shadow-md">
            <div className="flex items-center space-x-2">
                <img src="/favicon.webp" alt="Favicon" className="w-8 h-8 rounded-full" />
                <h1 className="text-lg font-bold text-gray-800">Investigation System</h1>
            </div>
            
            <div className="relative">
  <button 
    className="flex items-center space-x-2 text-white font-semibold py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-purple-600 rounded-md shadow-md hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  >
    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
    <span className="font-bold text-[10px] sm:text-xs">Login</span>
    <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
  </button>
  
  {isDropdownOpen && (
    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden z-50 transition-opacity duration-300">
      <Link 
        to="/User/login" 
        className="flex items-center px-3 sm:px-4 py-2 text-gray-800 hover:bg-gray-100 hover:text-gray-700 font-medium space-x-2 transition-all"
      >
        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        <span className="text-[10px] sm:text-xs">Login as a User</span>
      </Link>
      <Link 
        to="/Investigator/login" 
        className="flex items-center px-3 sm:px-4 py-2 text-gray-800 hover:bg-gray-100 hover:text-gray-700 font-medium space-x-2 transition-all"
      >
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
        <span className="text-[10px] sm:text-xs">Login as an Investigator</span>
      </Link>
    </div>
  )}
</div>

        </header>
    );
}

export default Header;
