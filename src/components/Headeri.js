import React from "react";
import { Link } from "react-router-dom";
import { FileText, Briefcase, CheckCircle, User } from "lucide-react"; // Import specific icons

function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-500 text-white flex-wrap shadow-md">
      {/* Logo & Title */}
      <div className="flex items-center space-x-3">
        <img src="/favicon.webp" alt="Logo" className="w-10 h-10 rounded-full" />
        <h1 className="text-xl font-bold">Police Investigation System</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex space-x-6 text-sm font-medium">
        {/* File FIR */}
        <Link to="/Investigator/PendingFir" className="flex items-center space-x-1 hover:text-gray-300 transition">
          <FileText size={20} />
          <span>New FIR</span>
        </Link>

        {/* Pending Cases */}
        <Link to="/Investigator/RunningFir" className="flex items-center space-x-1 hover:text-gray-300 transition">
          <Briefcase size={20} />
          <span>Running Cases</span>
        </Link>

        {/* Solved Cases */}
        <Link to="/Investigator/SolvedFir" className="flex items-center space-x-1 hover:text-gray-300 transition">
          <CheckCircle size={20} />
          <span>Solved Cases</span>
        </Link>

        {/* My Profile */}
        <Link to="/Investigator/Profile" className="flex items-center space-x-1 hover:text-gray-300 transition">
          <User size={20} />
          <span>My Profile</span>
        </Link>
      </nav>
    </header>
  );
}

export default Header;
