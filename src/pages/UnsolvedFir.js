import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Headeri from "../components/Headeri";
import Footer from "../components/Footeri";
import Navbari from "../components/Navbari";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc, query, where } from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";
import { ChevronDown, Calendar, Flag } from "lucide-react";

const investigationSteps = [
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
  {
    phase: "Phase 2: Evidence Collection & Crime Scene Processing",
    steps: [
      "Secure the Crime Scene – Prevent contamination and unauthorized access.",
      "Document the Scene – Take photographs, videos, and notes.",
      "Collect Physical Evidence – Secure fingerprints, DNA, weapons, documents, etc.",
      "Examine Digital Evidence – Extract data from computers, phones, and surveillance cameras.",
      "Interview First Responders – Gather insights from police officers, paramedics, or eyewitnesses.",
      "Sketch or Reconstruct the Scene – Create diagrams or 3D reconstructions of events.",
      "Determine Timeframe of Events – Establish a timeline based on evidence and testimonies.",
      "Check for Witnesses Nearby – Look for surveillance footage or bystanders who may have seen something.",
    ],
  },
  {
    phase: "Phase 3: Interviews & Intelligence Gathering",
    steps: [
      "Interview Victims & Witnesses – Obtain firsthand accounts of the incident.",
      "Analyze Witness Credibility – Cross-check statements for inconsistencies or bias.",
      "Develop Suspect Profiles – Use behavioral analysis to identify potential perpetrators.",
      "Conduct Background Checks – Investigate criminal history, financial records, and affiliations.",
      "Follow Financial Trails – Examine bank statements, transactions, and assets if fraud is suspected.",
      "Surveillance & Tracking – Monitor suspect movements using legal tracking methods.",
      "Gather Informant Tips – Use confidential sources to obtain inside information.",
      "Analyze Communication Records – Check call logs, messages, emails, and social media activity.",
      "Conduct Polygraph Tests (if applicable) – Assess suspect honesty using lie detection methods.",
    ],
  },
  {
    phase: "Phase 4: Analysis & Case Building",
    steps: [
      "Compare Evidence & Witness Testimonies – Look for consistencies and contradictions.",
      "Use Forensic Analysis – Apply ballistics, DNA, handwriting analysis, and toxicology if necessary.",
      "Establish Motive, Means, and Opportunity – Determine why, how, and when the crime occurred.",
      "Map Out Connections Between Individuals – Use link analysis to identify relationships.",
      "Reconstruct the Crime – Use available evidence to create a possible sequence of events.",
    ],
  },
  {
    phase: "Phase 5: Closing the Case & Reporting",
    steps: [
      "Draw Conclusions & Identify the Culprit – Based on solid evidence and logical deductions.",
      "Prepare an Official Report – Document all findings in a structured manner.",
      "Present Evidence to Authorities – Work with prosecutors, lawyers, or relevant agencies.",
      "Ensure Proper Chain of Custody – Maintain records to preserve evidence integrity.",
      "Testify in Court (if required) – Provide expert analysis and sworn statements.",
      "Close the Case or Continue Investigation – If sufficient evidence is found, proceed with legal action; if not, continue gathering information.",
      "Review Investigation for Errors or Missed Leads – Double-check the case before finalizing.",
      "Store Evidence & Secure Records – Ensure proper archiving for future reference.",
      "Provide Support to Victims & Witnesses – Offer guidance on legal steps and protection if needed.",
      "Reflect & Improve Investigation Techniques – Analyze the case for lessons learned and areas of improvement.",
    ],
  },
];

const FIRSubmission = () => {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [investigationData, setInvestigationData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");
  const [oldStatus, setOldStatus] = useState("");
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Fetch FIRs assigned to the logged-in investigator
  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    setLoading(true);

    if (!user) {
      toast.error("Please log in to view your cases.");
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "firs"),
        where("assignedInvestigator", "==", user.uid)
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

  return () => unsubscribe(); // Cleanup listener on unmount
}, []);

  // Fetch investigation data for a specific FIR
  useEffect(() => {
    if (activeCaseId) {
      const fetchInvestigationData = async () => {
        try {
          const investigationDoc = await getDocs(collection(db, "investigations"));
          const investigationData = investigationDoc.docs.find(
            (doc) => doc.data().firId === activeCaseId
          );
          if (investigationData) {
            setInvestigationData(investigationData.data().data);
          } else {
            setInvestigationData({});
          }
        } catch (error) {
          toast.error("Failed to fetch investigation data");
          console.error("Error fetching investigation data:", error);
        }
      };

      fetchInvestigationData();
    }
  }, [activeCaseId]);

  const openReasonModal = (firId, newStatus, oldStatus) => {
    setCurrentCaseId(firId);
    setCurrentStatus(newStatus);
    setOldStatus(oldStatus);
    setShowReasonModal(true);
    setReasonText("");
  };

  const openReopenModal = (firId) => {
    setCurrentCaseId(firId);
    setShowReopenModal(true);
    setReasonText("");
  };

  const saveReason = async () => {
    if (!reasonText.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    try {
      const updateData = {
        status: currentStatus,
        [`${currentStatus.toLowerCase()}Reason`]: reasonText
      };

      // Remove old reason if it exists
      if (oldStatus === "Rejected") {
        updateData.rejectedReason = null;
      } else if (oldStatus === "UnSolved") {
        updateData.unsolvedReason = null;
      }

      await updateDoc(doc(db, "firs", currentCaseId), updateData);

      setFirs((prev) =>
        prev.map((f) => {
          if (f.id === currentCaseId) {
            const updatedFir = {
              ...f,
              status: currentStatus,
              [`${currentStatus.toLowerCase()}Reason`]: reasonText
            };
            // Remove old reason from local state
            if (oldStatus === "Rejected") {
              delete updatedFir.rejectedReason;
            } else if (oldStatus === "UnSolved") {
              delete updatedFir.unsolvedReason;
            }
            return updatedFir;
          }
          return f;
        })
      );

      toast.success(`Case marked as ${currentStatus} with reason`);
      setShowReasonModal(false);
    } catch (error) {
      toast.error("Failed to update status with reason");
      console.error("Error updating status:", error);
    }
  };

  const handleReopenCase = async () => {
    if (!reasonText.trim()) {
      toast.error("Please enter a reason for reopening the case");
      return;
    }

    try {
      await updateDoc(doc(db, "firs", currentCaseId), {
        status: "Active",
        reopenReason: reasonText,
        unsolvedReason: null // Clear the unsolved reason if it exists
      });

      setFirs((prev) =>
        prev.map((f) => {
          if (f.id === currentCaseId) {
            const updatedFir = {
              ...f,
              status: "Active",
              reopenReason: reasonText
            };
            // Remove unsolved reason from local state
            delete updatedFir.unsolvedReason;
            return updatedFir;
          }
          return f;
        })
      );

      toast.success("Case reopened successfully");
      setShowReopenModal(false);
    } catch (error) {
      toast.error("Failed to reopen case");
      console.error("Error reopening case:", error);
    }
  };

  const handleStartSolvingCase = (firId) => {
    setActiveCaseId(firId);
    setShowInvestigationForm(true);
  };

  const handleInputChange = (phaseIndex, stepIndex, value) => {
    const updatedData = { ...investigationData };
    if (!updatedData[phaseIndex]) updatedData[phaseIndex] = [];
    updatedData[phaseIndex][stepIndex] = value;
    setInvestigationData(updatedData);
  };

  const calculateProgress = () => {
    let completedSteps = 0;
    investigationSteps.forEach((phase, phaseIndex) => {
      phase.steps.forEach((_, stepIndex) => {
        if (investigationData[phaseIndex]?.[stepIndex]) {
          completedSteps++;
        }
      });
    });
    return (completedSteps / 40) * 100;
  };

  const handleSaveInvestigation = async () => {
    setSaveLoading(true);
    try {
      await setDoc(doc(db, "investigations", activeCaseId), {
        firId: activeCaseId,
        data: investigationData,
      });

      const progress = calculateProgress();
      if (progress === 100) {
        await updateDoc(doc(db, "firs", activeCaseId), { status: "Solved" });
        setFirs((prev) =>
          prev.map((f) =>
            f.id === activeCaseId ? { ...f, status: "Solved" } : f
          )
        );
        toast.success("Case marked as solved successfully");
      } else {
        toast.success("Investigation data saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save investigation data");
      console.error("Error saving investigation data:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangeStatus = async (firId, newStatus, oldStatus) => {
    if (newStatus === "Rejected" || newStatus === "UnSolved") {
      openReasonModal(firId, newStatus, oldStatus);
      return;
    }

    try {
      const updateData = { status: newStatus };
      
      // Remove old reason fields if they exist
      if (oldStatus === "Rejected") {
        updateData.rejectedReason = null;
      } else if (oldStatus === "UnSolved") {
        updateData.unsolvedReason = null;
      }

      await updateDoc(doc(db, "firs", firId), updateData);
      
      setFirs((prev) =>
        prev.map((f) => {
          if (f.id === firId) {
            const updatedFir = { ...f, status: newStatus };
            // Remove old reason from local state
            if (oldStatus === "Rejected") {
              delete updatedFir.rejectedReason;
            } else if (oldStatus === "UnSolved") {
              delete updatedFir.unsolvedReason;
            }
            return updatedFir;
          }
          return f;
        })
      );
      
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Error updating status:", error);
    }
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
    return firs.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.incidentDateTime) - new Date(b.incidentDateTime);
      } else if (sortBy === "priority") {
        return a.priority - b.priority;
      }
      return 0;
    });
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
            className={`px-3 py-1 rounded-full text-sm ${getStatusColor(fir.status)}`}
          >
            {fir.status}
          </span>
        </div>
        <p className="text-gray-700 mb-2">
          {new Date(fir.incidentDateTime).toLocaleString()}
        </p>
        <p className="text-gray-600 truncate">{fir.incidentDescription}</p>
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
        
        {/* Display reason if available */}
        {(fir.status === "Rejected" || fir.status === "UnSolved") && fir[`${fir.status.toLowerCase()}Reason`] && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-semibold">{fir.status} Reason:</p>
            <p>{fir[`${fir.status.toLowerCase()}Reason`]}</p>
          </div>
        )}
        
        {/* Display reopen reason if available */}
        {fir.reopenReason && (
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="font-semibold">Reopen Reason:</p>
            <p>{fir.reopenReason}</p>
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
              onClick={() => handleStartSolvingCase(fir.id)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Solving Case
            </button>
          )}
        </div>
        
        {/* Add Reopen Case button for Unsolved cases */}
        {fir.status === "UnSolved" && (
          <div className="mt-4">
            <button
              onClick={() => openReopenModal(fir.id)}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full"
            >
              Reopen Case
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-300">
      <Headeri />
      <Navbari />
      <ToastContainer position="top-right" autoClose={3000} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
          FIR Cases Management System
        </h1>
        
        {/* Sort Dropdown */}
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
         
        
          {/* UnSolved Cases Section */}
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-left mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              UnSolved Cases ({firs.filter((f) => f.status === "UnSolved").length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderFIRsByStatus("UnSolved")}
            </div>
          </div>

        </div>
      </main>

      {/* Reason Input Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Provide Reason for {currentStatus}</h2>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full p-3 border rounded mb-4"
              rows={5}
              placeholder={`Enter reason for marking this case as ${currentStatus}...`}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveReason}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Case Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Provide Reason for Reopening Case</h2>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full p-3 border rounded mb-4"
              rows={5}
              placeholder="Enter reason for reopening this case..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleReopenCase}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Reopen Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Form Modal */}
      {showInvestigationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Investigation Form</h2>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Progress: {calculateProgress().toFixed(2)}%
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
            {investigationSteps.map((phase, phaseIndex) => (
              <div key={phaseIndex} className="mb-6">
                <h3 className="text-xl font-semibold mb-4">{phase.phase}</h3>
                {phase.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {step}
                    </label>
                    <textarea
                      value={investigationData[phaseIndex]?.[stepIndex] || ""}
                      onChange={(e) =>
                        handleInputChange(phaseIndex, stepIndex, e.target.value)
                      }
                      className="mt-1 p-2 w-full border rounded-md"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={handleSaveInvestigation}
                disabled={saveLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {saveLoading ? "Saving..." : "Save Investigation"}
              </button>
              <button
                onClick={() => setShowInvestigationForm(false)}
                className="ml-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIR Details Modal */}
      {showModal && selectedFIR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">FIR Details</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Complainant Information</h3>
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
                <strong>Address:</strong> {selectedFIR.incidentLocation.address}
              </p>
              <p>
                <strong>City:</strong> {selectedFIR.incidentLocation.city}
              </p>
              <p>
                <strong>State:</strong> {selectedFIR.incidentLocation.state}
              </p>
              <p>
                <strong>GPS Coordinates:</strong>{" "}
                {selectedFIR.incidentLocation.gpsCoordinates}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Suspect Information</h3>
              <p>
                <strong>Name:</strong> {selectedFIR.suspectDetails.name}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedFIR.suspectDetails.description}
              </p>
              <p>
                <strong>Known Address:</strong>{" "}
                {selectedFIR.suspectDetails.knownAddress}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Witness Information</h3>
              <p>
                <strong>Name:</strong> {selectedFIR.witnessDetails.name}
              </p>
              <p>
                <strong>Contact:</strong> {selectedFIR.witnessDetails.contact}
              </p>
            </div>

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