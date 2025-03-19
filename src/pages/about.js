import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserSecret } from "react-icons/fa";

function AboutUs() {
  const [investigators, setInvestigators] = useState([]);

  useEffect(() => {
    const fetchInvestigators = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "investigatordata"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvestigators(data);
      } catch (error) {
        toast.error("Error fetching investigator data. Please try again.");
      }
    };
    fetchInvestigators();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8">
  🔍 Meet Our Investigators
</h2>
        
        <div className="flex flex-wrap justify-center gap-6">
          {investigators.map((investigator) => (
            <div
              key={investigator.id}
              className="w-64 p-4 bg-white rounded-2xl border border-gray-300 shadow-lg 
                         hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                {/* Investigator Icon */}
                <div className="w-20 h-20 flex items-center justify-center bg-gray-300 rounded-full border border-gray-500">
                  <FaUserSecret className="text-gray-700 text-4xl" />
                </div>
                
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{investigator.username}</h3>
                <p className="text-gray-600 text-sm">{investigator.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default AboutUs;