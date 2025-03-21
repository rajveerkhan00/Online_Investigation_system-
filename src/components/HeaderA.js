import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { LayoutDashboard , Eye } from "lucide-react";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="relative flex items-center justify-between p-4 bg-gray-200 shadow-md">
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        <img src="/favicon.webp" alt="Favicon" className="w-8 h-8 rounded-full" />
        <h1 className="text-lg font-bold text-gray-800">Admin Investigation System</h1>
      </div>

      {/* Hamburger Menu Icon for Small Screens */}
      <div className="md:hidden">
        <button onClick={toggleMenu} className="text-gray-800 px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md transition hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {/* Header Buttons */}
      <div
  className={`${
    isMenuOpen ? "flex flex-col" : "hidden"
  } md:flex md:flex-row md:items-center absolute md:relative right-0 top-full bg-gray-200 md:bg-transparent shadow-md md:shadow-none p-2 md:p-0 space-y-2 md:space-y-0 md:space-x-4 rounded-lg w-auto`}
>
  
{/* Showing page */}
<button className="flex items-center space-x-2 text-gray-600 font-semibold hover:text-gray-500 transition focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 p-2 rounded-md">
      <Eye className="h-5 w-5" /> {/* New Icon */}
      <Link to="/Admin/Home" className="font-bold text-sm">Showing Page</Link>
    </button>
  {/* DashBoard */}
  <button className="flex items-center space-x-2 text-red-600 font-semibold hover:text-red-500 transition focus:ring-2 focus:ring-red-300 focus:ring-offset-2 p-2 rounded-md">
      <LayoutDashboard className="h-5 w-5" />
      <Link to="/Admin/Dashboard" className="font-bold text-sm">Dashboard</Link>
    </button>
</div>

    </header>
  );
}

export default Header;