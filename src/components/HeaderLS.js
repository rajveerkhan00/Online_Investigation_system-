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
                    className="flex items-center space-x-2 text-white font-semibold py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <UserPlus className="w-5 h-5 text-white" />
                    <span className="font-bold text-sm">Signup</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden z-50 transition-opacity duration-300">
                        <Link 
                            to="/User/Signup" 
                            className="flex items-center px-4 py-3 text-gray-800 hover:bg-blue-100 hover:text-blue-700 font-medium space-x-2 transition-all"
                        >
                            <User className="w-5 h-5 text-blue-600" />
                            <span>Signup as a User</span>
                        </Link>
                        <Link 
                            to="/Investigator/Signup" 
                            className="flex items-center px-4 py-3 text-gray-800 hover:bg-purple-100 hover:text-purple-700 font-medium space-x-2 transition-all"
                        >
                            <Shield className="w-5 h-5 text-purple-600" />
                            <span>Signup as an Investigator</span>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
