import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import HeaderSL from "../components/HeaderSL";
import { ChevronDown, UserPlus, CheckCircle, User, Briefcase, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

function Front() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="min-h-screen flex flex-col bg-gray-200">
            {/* Header Section */}
            <HeaderSL />

            {/* Image Section */}
            <main className="flex flex-col sm:flex-row items-center justify-center flex-grow p-4 bg-gray-200">
    <motion.img
        src="mainpageimage.png"
        alt="Description of Left Image"
        className="w-1/6 md:w-1/5 lg:w-1/6 h-auto"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.img
        src="mainpageimage.png"
        alt="Description of Main Image"
        className="w-1/3 md:w-1/2 lg:w-1/3 h-auto z-10"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.9, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.img
        src="mainpageimage.png"
        alt="Description of Right Image"
        className="w-1/6 md:w-1/5 lg:w-1/6 h-auto"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
    />
</main>


         

{/* Proceed Button Section */}
<div className="flex justify-center items-center bg-gray-200 mb-6 mt-8">
  <Link to="/Frontpage">
    <button className="w-full sm:w-auto flex justify-center items-center space-x-2 text-white font-semibold py-1.5 px-3 sm:py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-xs sm:text-sm">
      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      <span className="font-bold text-xs sm:text-sm">Proceed</span>
    </button>
  </Link>
</div>

{/* Signup Button Section */}
<div className="relative flex justify-center items-center bg-gray-200 py-3">
  <div className="relative">
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-full sm:w-40 flex justify-between items-center text-white font-semibold py-1.5 px-3 sm:py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-xs sm:text-sm"
    >
      <div className="flex items-center space-x-1 sm:space-x-2">
        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        <span className="font-bold text-xs sm:text-sm">Signup</span>
      </div>
      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
    </button>
    {isOpen && (
      <div className="absolute w-full mt-2 bg-white rounded-md shadow-lg overflow-hidden">
        <Link to="/User/Signup" className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm">
          <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" /> 
          Signup as User
        </Link>
        <Link to="/Investigator/Signup" className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm">
          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" /> 
          Signup as Investigator
        </Link>
        <Link to="/Admin/Signup" className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" /> 
          Signup as Admin
        </Link>
      </div>
    )}
  </div>
</div>

            {/* Footer Section */}
            <Footer />
        </div>
    );
}

export default Front;