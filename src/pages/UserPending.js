import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase"; // Import Firebase configurations
import { collection, getDocs, query, where } from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";
import Chatbot from "../components/Chatbot";

const FIRSubmission = () => {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [showModal, setShowModal] = useState(false);

    // Fetch FIRs for the logged-in user
    useEffect(() => {
      const fetchFirs = async () => {
        // Wait for Firebase to initialize and check if a user is logged in
        auth.onAuthStateChanged(async (user) => {
          if (!user) {
            // If no user is logged in, stop loading and return
            setLoading(false);
            return;
          }
  
          try {
            // Fetch FIRs for the logged-in user
            const q = query(collection(db, "firs"), where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const firData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setFirs(firData);
          } catch (error) {
            toast.error("Failed to fetch FIRs");
            console.error("Error fetching FIRs:", error);
          } finally {
            setLoading(false);
          }
        });
      };
  
      fetchFirs();
    }, []);
  

  const handleViewDetails = (fir) => {
    setSelectedFIR(fir);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFIR(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "Solved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderFIRsByStatus = (status) => {
    return firs
      .filter((fir) => fir.status === status)
      .map((fir) => (
        <div key={fir.id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{fir.complainantName}</h3>
              <p className="text-sm text-gray-600">{fir.incidentType}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(fir.status)}`}>
              {fir.status}
            </span>
          </div>
          <p className="text-gray-700 mb-2">
            {new Date(fir.incidentDateTime).toLocaleString()}
          </p>
          <p className="text-gray-600 truncate">{fir.incidentDescription}</p>
          {/* Display uploaded images */}
          <div className="mt-4 flex space-x-2">
            {fir.supportingDocuments.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Document ${index + 1}`}
                className="w-16 h-16 object-cover rounded"
              />
            ))}
          </div>
          <button
            onClick={() => handleViewDetails(fir)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            View Details
          </button>
        </div>
      ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navbar />
      <Chatbot />
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

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-left mb-10 mt-10">
          Online FIR Submission System
        </h1>

        {/* Submitted FIRs List */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Pending Cases</h2>
          {loading ? (
            <div className="flex justify-center">
              <TailSpin color="#6366f1" height={50} width={50} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderFIRsByStatus("Pending")}
            </div>
          )}
        </div>
      </main>

      {/* Modal for displaying FIR details */}
      {showModal && selectedFIR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">FIR Details</h2>

            {/* Complainant Information */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Complainant Information</h3>
              <p><strong>Name:</strong> {selectedFIR.complainantName}</p>
              <p><strong>Contact Number:</strong> {selectedFIR.contactNumber}</p>
              <p><strong>Email:</strong> {selectedFIR.email}</p>
            </div>

            {/* Incident Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Incident Details</h3>
              <p><strong>Type:</strong> {selectedFIR.incidentType}</p>
              <p><strong>Date & Time:</strong> {new Date(selectedFIR.incidentDateTime).toLocaleString()}</p>
              <p><strong>Description:</strong> {selectedFIR.incidentDescription}</p>
            </div>

            {/* Location Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Location Details</h3>
              <p><strong>Address:</strong> {selectedFIR.incidentLocation.address}</p>
              <p><strong>City:</strong> {selectedFIR.incidentLocation.city}</p>
              <p><strong>State:</strong> {selectedFIR.incidentLocation.state}</p>
              <p><strong>GPS Coordinates:</strong> {selectedFIR.incidentLocation.gpsCoordinates}</p>
            </div>

            {/* Suspect Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Suspect Information</h3>
              <p><strong>Name:</strong> {selectedFIR.suspectDetails.name}</p>
              <p><strong>Description:</strong> {selectedFIR.suspectDetails.description}</p>
              <p><strong>Known Address:</strong> {selectedFIR.suspectDetails.knownAddress}</p>
            </div>

            {/* Witness Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Witness Information</h3>
              <p><strong>Name:</strong> {selectedFIR.witnessDetails.name}</p>
              <p><strong>Contact:</strong> {selectedFIR.witnessDetails.contact}</p>
            </div>

            {/* Supporting Documents */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Supporting Documents</h3>
              <div className="space-y-2">
                {selectedFIR.supportingDocuments.map((url, index) => (
                  <div key={index} className="text-blue-600">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Document {index + 1}
                    </a>
                  </div>
                ))}
              </div>
              {/* Display uploaded images */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFIR.supportingDocuments.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Document ${index + 1}`}
                    className="w-32 h-32 object-cover rounded"
                  />
                ))}
              </div>
            </div>

            {/* Close Modal Button */}
            <button
              onClick={closeModal}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FIRSubmission;