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
            <div className="container mx-auto py-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Our Investigators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investigators.map((investigator) => (
                        <div key={investigator.id} className="p-6 bg-white rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800">{investigator.username}</h3>
                            <p className="text-gray-600">{investigator.email}</p>
                            <button className="mt-4 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                Start Chat
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
