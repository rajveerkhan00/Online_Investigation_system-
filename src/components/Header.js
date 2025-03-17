import React from "react";
import { Link } from 'react-router-dom' ;

function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-200 flex-wrap pt-6 shadow-md">
       <div className="flex items-center space-x-2">
                <img src="/favicon.webp" alt="Favicon" className="w-8 h-8 rounded-full" />
                <h1 className="text-lg font-bold text-gray-800">Investigation System</h1>
            </div>

      <div className="flex items-center space-x-4 mt-2 md:mt-0">

        {/* FIR Button (Newly Added) */}
  <button className="flex items-center space-x-1 text-red-600 font-semibold hover:text-red-500 transition">
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
        d="M12 4v16m8-8H4"
      />
    </svg>
    <a href="/User/Fir" className="font-bold text-sm">New FIR</a>
  </button>

  {/* My Case Button */}
  <button className="flex items-center space-x-1 text-gray-800 font-semibold hover:text-gray-600 transition">
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
        d="M8 7l4-4 4 4M8 17l4 4 4-4M4 12h16"
      />
    </svg>
    <a href="/User/Pending/Fir" className="font-bold text-sm">Pending Cases</a>
  </button>

  {/* My Case Button */}
  <button className="flex items-center space-x-1 text-gray-800 font-semibold hover:text-gray-600 transition">
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
      d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
    />
  </svg>
  <a href="/User/Active/Fir" className="font-bold text-sm">Active Cases</a>
</button>

  {/* Complete Cases Button */}
  <button className="flex items-center space-x-1 text-gray-800 font-semibold hover:text-gray-600 transition">
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
        d="M9 12l2 2 4-4m5 4.5V16a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16v-1.5a2.5 2.5 0 012.5-2.5h13A2.5 2.5 0 0121 14.5z"
      />
    </svg>
    <a href="/User/Solved/Fir" className="font-bold text-sm">Solved Cases</a>
  </button>

  <button className="flex items-center space-x-1 text-gray-800 font-semibold hover:text-gray-600 transition">
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
  <a href="/User/Rejected/Fir" className="font-bold text-sm">Rejected Cases</a>
</button>

  {/* My Profile Button */}
  <button className="flex items-center space-x-1 text-gray-800 font-semibold hover:text-gray-600 transition">
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
        d="M5.121 17.804A4 4 0 016.992 20h10.016a4 4 0 001.87-2.196M9 11a3 3 0 100-6 3 3 0 000 6zm6 0a3 3 0 100-6 3 3 0 000 6zm-3 4a7.002 7.002 0 00-6.134 3.21"
      />
    </svg>
    <a href="/User/Profile" className="font-bold text-sm">My Profile</a>
  </button>
</div>

    </header>
  );
}

export default Header;
