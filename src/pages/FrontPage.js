import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import HeaderSL from "../components/HeaderSL"; // ✅ Import the new reusable header
import { ChevronDown, UserPlus } from "lucide-react";
import { db } from "../firebase"; // Import Firebase Firestore
import { collection, getDocs } from "firebase/firestore";
import { User, Briefcase, ShieldCheck } from "lucide-react";

const Client = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null); // State to track the selected case for details view

  // Fetch cases from Firestore
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cases"));
        const casesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCases(casesData);
      } catch (error) {
        toast.error("Error fetching cases: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleCaseClick = (caseData) => {
    setSelectedCase(caseData); // Set the selected case for details view
  };

  const handleBackToList = () => {
    setSelectedCase(null); // Clear the selected case to return to the list view
  };
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-200">
      <HeaderSL />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <section className="text-gray-700 body-font">
        <h1 className="font-bold text-xl md:text-xl lg:text-3xl text-center mt-10 md:mt-10">
          Some Successful Cases!
        </h1>

        {selectedCase ? ( // Show details view if a case is selected
          <div className="container px-5 py-8 mx-auto">
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-500 hover:text-blue-700"
            >
              &larr; Back to List
            </button>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-2">{selectedCase.name}</h2>
              <h3 className="text-gray-500 text-sm mb-4">
                {selectedCase.type}
              </h3>
              <img
                alt={selectedCase.name}
                className="w-full h-64 object-cover object-center rounded-lg mb-4"
                src={selectedCase.picUrl}
              />
              <p className="mb-4">{selectedCase.description}</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {selectedCase.img1 && (
                  <img
                    alt="Image 1"
                    className="w-full h-32 object-cover object-center rounded-lg"
                    src={selectedCase.img1}
                  />
                )}
                {selectedCase.img2 && (
                  <img
                    alt="Image 2"
                    className="w-full h-32 object-cover object-center rounded-lg"
                    src={selectedCase.img2}
                  />
                )}
                {selectedCase.img3 && (
                  <img
                    alt="Image 3"
                    className="w-full h-32 object-cover object-center rounded-lg"
                    src={selectedCase.img3}
                  />
                )}
              </div>
              <p className="mb-4">{selectedCase.description1}</p>
              <p className="mb-4">{selectedCase.description2}</p>
            </div>
          </div>
        ) : (
          <div className="container px-5 py-8 mx-auto">
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : (
              <div className="flex flex-wrap -m-4">
                {cases.map((item) => (
                  <div
                    key={item.id}
                    className="lg:w-1/4 md:w-1/3 sm:w-1/2 p-4 w-full pro cursor-pointer"
                    onClick={() => handleCaseClick(item)} // Handle click to show details
                  >
                    <a className="block relative h-48 rounded overflow-hidden">
                      <img
                        alt={item.name}
                        className="object-cover object-center w-full h-full block"
                        src={item.picUrl}
                      />
                    </a>
                    <div className="mt-4">
                      <h3 className="text-gray-500 text-xs tracking-widest title-font mb-1">
                        {item.type}
                      </h3>
                      <h2 className="text-gray-900 title-font text-lg font-medium">
                        {item.name}
                      </h2>
                      <p className="mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

    {/* Signup Button Section */}
<div className="relative flex justify-center items-center bg-gray-200 py-4">
    <div className="relative">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-36 sm:w-48 flex justify-between items-center text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
        >
            <div className="flex items-center space-x-2">
                <UserPlus className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                <span className="font-bold text-sm sm:text-lg">Signup</span>
            </div>
            <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
        </button>
        {isOpen && (
            <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg overflow-hidden">
                <Link to="/User/Signup" className="flex items-center px-4 sm:px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-500" /> Signup as User
                </Link>
                <Link to="/Investigator/Signup" className="flex items-center px-4 sm:px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Briefcase className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-purple-500" /> Signup as Investigator
                </Link>
                <Link to="/Admin/Signup" className="flex items-center px-4 sm:px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-red-500" /> Signup as Admin
                </Link>
            </div>
        )}
    </div>
</div>

      <Footer />
    </div>
  );
};

export default Client;