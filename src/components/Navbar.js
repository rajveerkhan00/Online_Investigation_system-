import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-500 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10 sm:h-10">
          <div className="md:flex space-x-6">
            <a href="/Home" className="text-gray-200 hover:text-gray-300 font-medium text-sm sm:text-base">Home</a>
            <a href="/Contact" className="text-gray-200 hover:text-gray-300 font-medium text-sm sm:text-base">Contact Us</a>
            <a href="/About" className="text-gray-200 hover:text-gray-300 font-medium text-sm sm:text-base">About Us</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
