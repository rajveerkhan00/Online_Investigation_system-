import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Footer from "../components/Footer";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8">
        🔍 Meet Our Investigators
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {investigators.map((investigator) => (
            <div 
                key={investigator.id} 
                className="p-6 bg-white rounded-2xl border-4 border-blue-500 shadow-lg 
                transition-transform transform hover:scale-105 hover:shadow-xl"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-500 overflow-hidden">
                        <img 
                            src={investigator.profilePic || "https://via.placeholder.com/100"} 
                            alt="Investigator" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h3 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
                        {investigator.username}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">{investigator.email}</p>
                </div>
                <button 
                    className="mt-5 w-full px-4 py-3 text-base sm:text-lg font-semibold text-white 
                    bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg hover:from-blue-600 hover:to-blue-800 
                    transition-all focus:outline-none focus:ring-4 focus:ring-blue-400"
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
