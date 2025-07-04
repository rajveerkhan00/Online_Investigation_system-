import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Verify from "../components/IdCardVerification";
import UserNot from "../components/UserNot";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";
import Chatbot from "../components/ChatBotUI";
import { ChevronDown, Calendar, Flag } from "lucide-react";
import { getInvestigationSteps } from "../Services/investigationService";
import useAuthTimeout from "../hooks/useAuthTimeout";
import { useNavigate } from "react-router-dom";

const DEFAULT_INVESTIGATION_STEPS = [
  {
    phase: "Phase 1: Case Initiation & Planning",
    steps: [
      "Receive Case Assignment – Obtain case details from the client, law enforcement, or agency.",
      "Understand the Case Type – Determine whether it's a criminal, civil, corporate, or private investigation.",
      "Review Initial Reports – Analyze any police reports, witness statements, or preliminary evidence.",
      "Set Investigation Goals – Define the objectives (e.g., prove/disprove a claim, find a missing person, collect forensic evidence).",
      "Plan Investigation Strategy – Outline steps, allocate resources, and define priorities.",
      "Gather Background Information – Research the people, locations, and context of the case.",
      "Identify Key Stakeholders – Determine who is involved (victims, suspects, witnesses, law enforcement).",
      "Establish Jurisdiction & Legal Boundaries – Ensure legal procedures are followed to avoid invalid evidence.",
    ],
  },
  // ... (keep all your existing phases)
];

const FIRSubmission = () => {
  // Use the auth timeout hook (5 minutes inactivity)
  useAuthTimeout(5);
  const navigate = useNavigate();

  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [investigationData, setInvestigationData] = useState({});
  const [investigationSteps, setInvestigationSteps] = useState(DEFAULT_INVESTIGATION_STEPS);
  const [showTrackInvestigation, setShowTrackInvestigation] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const fetchFirs = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (!user) {
          navigate('/user/login');
          setLoading(false);
          return;
        }

        try {
          const q = query(
            collection(db, "firs"),
            where("userId", "==", user.uid)
          );
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
  }, [navigate]);

  useEffect(() => {
    if (activeCaseId) {
      const fetchInvestigationData = async () => {
        try {
          const firDoc = await getDoc(doc(db, "firs", activeCaseId));
          if (!firDoc.exists()) {
            throw new Error("FIR document not found");
          }
          
          const firData = firDoc.data();
          const incidentType = firData.incidentType;

          const investigationResult = await getInvestigationSteps(activeCaseId, incidentType);
          
          if (investigationResult.steps) {
            setInvestigationSteps(investigationResult.steps);
          }

          const investigationDoc = await getDoc(doc(db, "investigations", activeCaseId));
          if (investigationDoc.exists()) {
            setInvestigationData(investigationDoc.data().data || {});
          } else {
            setInvestigationData({});
          }
        } catch (error) {
          toast.error("Failed to fetch investigation data");
          console.error("Error fetching investigation data:", error);
          setInvestigationSteps(DEFAULT_INVESTIGATION_STEPS);
          setInvestigationData({});
        }
      };

      fetchInvestigationData();
    }
  }, [activeCaseId]);

  const handleTrackInvestigation = (firId) => {
    setActiveCaseId(firId);
    setShowTrackInvestigation(true);
  };

  const calculateProgress = () => {
    let completedSteps = 0;
    let totalSteps = 0;

    investigationSteps.forEach((phase, phaseIndex) => {
      phase.steps.forEach((_, stepIndex) => {
        totalSteps++;
        if (investigationData[phaseIndex]?.[stepIndex]) {
          completedSteps++;
        }
      });
    });

    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  };

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
      case "UnSolved":
        return "bg-purple-100 text-purple-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sortFirs = (firs, sortBy) => {
    if (sortBy === "date") {
      return [...firs].sort(
        (a, b) => new Date(b.incidentDateTime) - new Date(a.incidentDateTime)
      );
    } else if (sortBy === "priority") {
      const priorityOrder = { Murder: 1, Theft: 2, Fraud: 3, Other: 4 };
      return [...firs].sort(
        (a, b) => priorityOrder[a.incidentType] - priorityOrder[b.incidentType]
      );
    }
    return firs;
  };

  const renderFIRsByStatus = (status) => {
    const filteredFirs = firs.filter((fir) => fir.status === status);
    const sortedFirs = sortFirs(filteredFirs, sortBy);

    return sortedFirs.map((fir) => (
      <div key={fir.id} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{fir.complainantName}</h3>
            <p className="text-sm text-gray-600">{fir.incidentType}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
              fir.status
            )}`}
          >
            {fir.status}
          </span>
        </div>
        <p className="text-gray-700 mb-2">
          {new Date(fir.incidentDateTime).toLocaleString()}
        </p>
        <p className="text-gray-600 truncate">{fir.incidentDescription}</p>
        <div className="mt-4 flex space-x-2">
          {fir.supportingDocuments?.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Document ${index + 1}`}
              className="w-16 h-16 object-cover rounded"
            />
          ))}
        </div>

        {fir.status === "Rejected" && fir.rejectedReason && (
          <div className="mt-4 p-3 bg-red-50 rounded border border-red-100">
            <p className="font-semibold text-red-800">Rejection Reason:</p>
            <p className="text-red-700">{fir.rejectedReason}</p>
          </div>
        )}

        {fir.status === "UnSolved" && fir.unsolvedReason && (
          <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-100">
            <p className="font-semibold text-purple-800">Unsolved Reason:</p>
            <p className="text-purple-700">{fir.unsolvedReason}</p>
          </div>
        )}

        {fir.reopenReason && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
            <p className="font-semibold text-blue-800">Reopen Reason:</p>
            <p className="text-blue-700">{fir.reopenReason}</p>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handleViewDetails(fir)}
            className="text-blue-600 hover:text-blue-800"
          >
            View Details
          </button>
          {fir.status === "Active" && (
            <button
              onClick={() => handleTrackInvestigation(fir.id)}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Track Investigation
            </button>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-300">
      <Header />
      <Navbar />
      <Verify />
      <Chatbot />
      <UserNot />
      
      
      <ToastContainer position="top-right" autoClose={3000} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
          Your All Cases / FIRs
        </h1>
        
        <div className="flex justify-center sm:justify-end mb-4 sm:mb-6 px-3 sm:px-6">
          <div className="relative w-40 sm:w-20">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center justify-between sm:justify-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-md shadow-md hover:bg-gray-800 transition duration-300 w-full sm:w-auto text-xs sm:text-base"
            >
              Sort <ChevronDown size={10} className="sm:size-18" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-full sm:w-48 bg-gray-800 text-white rounded-lg shadow-lg z-10 animate-fade-in">
                <button
                  onClick={() => {
                    setSortBy("date");
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
                >
                  <Calendar size={16} /> Sort by Date
                </button>
                <button
                  onClick={() => {
                    setSortBy("priority");
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
                >
                  <Flag size={16} /> Sort by Priority
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-left mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              Pending Cases ({firs.filter((f) => f.status === "Pending").length})
            </h2>
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
        </div>

        <div className="mt-12">
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-left mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              Active Cases ({firs.filter((f) => f.status === "Active").length})
            </h2>
            {loading ? (
              <div className="flex justify-center">
                <TailSpin color="#6366f1" height={50} width={50} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderFIRsByStatus("Active")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-left mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              Solved Cases ({firs.filter((f) => f.status === "Solved").length})
            </h2>
            {loading ? (
              <div className="flex justify-center">
                <TailSpin color="#6366f1" height={50} width={50} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderFIRsByStatus("Solved")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-left mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              UnSolved Cases ({firs.filter((f) => f.status === "UnSolved").length})
            </h2>
            {loading ? (
              <div className="flex justify-center">
                <TailSpin color="#6366f1" height={50} width={50} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderFIRsByStatus("UnSolved")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-left mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              Rejected Cases ({firs.filter((f) => f.status === "Rejected").length})
            </h2>
            {loading ? (
              <div className="flex justify-center">
                <TailSpin color="#6366f1" height={50} width={50} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderFIRsByStatus("Rejected")}
              </div>
            )}
          </div>
        </div>
      </main>

      {showTrackInvestigation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Track Investigation</h2>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Progress: {calculateProgress().toFixed(2)}%
              </h3>
              <div className="w-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full h-3 shadow-lg">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
            {investigationSteps.map((phase, phaseIndex) => (
              <div key={phaseIndex} className="mb-6">
                <h3 className="text-xl font-semibold mb-4">{phase.phase}</h3>
                {phase.steps.map((step, stepIndex) => {
                  const stepValue = investigationData[phaseIndex]?.[stepIndex];
                  if (stepValue) {
                    return (
                      <div key={stepIndex} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          {step}
                        </label>
                        <textarea
                          value={stepValue}
                          readOnly
                          className="mt-1 p-2 w-full border rounded-md bg-gray-100"
                          rows={3}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={() => setShowTrackInvestigation(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedFIR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">FIR Details</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Complainant Information
              </h3>
              <p>
                <strong>Name:</strong> {selectedFIR.complainantName}
              </p>
              <p>
                <strong>Contact Number:</strong> {selectedFIR.contactNumber}
              </p>
              <p>
                <strong>Email:</strong> {selectedFIR.email}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Incident Details</h3>
              <p>
                <strong>Type:</strong> {selectedFIR.incidentType}
              </p>
              <p>
                <strong>Date & Time:</strong>{" "}
                {new Date(selectedFIR.incidentDateTime).toLocaleString()}
              </p>
              <p>
                <strong>Description:</strong> {selectedFIR.incidentDescription}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Location Details</h3>
              <p>
                <strong>Address:</strong> {selectedFIR.incidentLocation?.address || 'N/A'}
              </p>
              <p>
                <strong>City:</strong> {selectedFIR.incidentLocation?.city || 'N/A'}
              </p>
              <p>
                <strong>State:</strong> {selectedFIR.incidentLocation?.state || 'N/A'}
              </p>
              <p>
                <strong>GPS Coordinates:</strong>{" "}
                {selectedFIR.incidentLocation?.gpsCoordinates || 'N/A'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Suspect Information
              </h3>
              <p>
                <strong>Name:</strong> {selectedFIR.suspectDetails?.name || 'N/A'}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedFIR.suspectDetails?.description || 'N/A'}
              </p>
              <p>
                <strong>Known Address:</strong>{" "}
                {selectedFIR.suspectDetails?.knownAddress || 'N/A'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Witness Information
              </h3>
              <p>
                <strong>Name:</strong> {selectedFIR.witnessDetails?.name || 'N/A'}
              </p>
              <p>
                <strong>Contact:</strong> {selectedFIR.witnessDetails?.contact || 'N/A'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Supporting Documents
              </h3>
              <div className="space-y-2">
                {selectedFIR.supportingDocuments?.length > 0 ? (
                  selectedFIR.supportingDocuments.map((url, index) => (
                    <div key={index} className="text-blue-600">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        Document {index + 1}
                      </a>
                    </div>
                  ))
                ) : (
                  <p>No supporting documents</p>
                )}
              </div>
            </div>

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
