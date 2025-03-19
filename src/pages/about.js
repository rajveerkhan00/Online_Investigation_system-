import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Footer from "../components/Footer";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUserSecret } from "react-icons/fa"; // Investigator icon

function AboutUs() {
    const [investigators, setInvestigators] = useState([]);

    useEffect(() => {
        const fetchInvestigators = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'investigatordata'));
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInvestigators(data);
            } catch (error) {
                toast.error("Error fetching investigator data. Please try again.");
            }
        };
        fetchInvestigators();
    }, []);

    return (
        <div className="bg-gray-200 min-h-screen">
            <Header />
            <Navbar />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            import { FaUserSecret } from "react-icons/fa"; // Import investigator icon

<div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-700 mb-6">
        🔍 Meet Our Investigators
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {investigators.map((investigator) => (
            <div 
                key={investigator.id} 
                className="p-4 bg-gray-200 rounded-xl border-2 border-gray-500 shadow-md 
                transition-transform transform hover:scale-105 hover:shadow-lg"
            >
                <div className="flex flex-col items-center text-center">
                    {/* Investigator Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center 
                        bg-gray-400 rounded-full border-2 border-gray-600">
                        <FaUserSecret className="text-gray-800 text-4xl sm:text-5xl" />
                    </div>
                    <h3 className="mt-2 text-lg sm:text-xl font-semibold text-gray-800">
                        {investigator.username}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm">{investigator.email}</p>
                </div>
                <button 
                    className="mt-4 w-full px-3 py-2 text-xs sm:text-sm font-medium text-white 
                    bg-gray-700 rounded-lg hover:bg-gray-800 
                    transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    💬 Start Chat
                </button>
            </div>
        ))}
    </div>
</div>


            <Footer />
        </div>
    );
}

export default AboutUs;
