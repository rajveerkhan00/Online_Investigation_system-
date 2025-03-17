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
            <main className="flex items-center justify-center flex-grow p-4 bg-gray-200 flex-wrap">
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
            <div className="flex justify-center items-center bg-gray-200 mb-8 mt-10">
                <Link to="/Frontpage">
                    <button className="w-3/3 flex justify-center items-center space-x-2 text-white font-semibold py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all">
                        <CheckCircle className="w-6 h-6 text-white" />
                        <span className="font-bold text-lg">Proceed</span>
                    </button>
                </Link>
            </div>

            {/* Signup Button Section */}
            <div className="relative flex justify-center items-center bg-gray-200 py-4">
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-48 flex justify-between items-center text-white font-semibold py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
                    >
                        <div className="flex items-center space-x-2">
                            <UserPlus className="w-6 h-6 text-white" />
                            <span className="font-bold text-lg">Signup</span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-white" />
                    </button>
                    {isOpen && (
                        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg overflow-hidden">
                            <Link to="/User/Signup" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                                <User className="w-5 h-5 mr-2 text-blue-500" /> Signup as User
                            </Link>
                            <Link to="/Investigator/Signup" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                                <Briefcase className="w-5 h-5 mr-2 text-purple-500" /> Signup as Investigator
                            </Link>
                            <Link to="/Admin/Signup" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                                <ShieldCheck className="w-5 h-5 mr-2 text-red-500" /> Signup as Admin
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