import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Headeri from "../components/Headeri";
import Footer from "../components/Footer";
import Navbari from "../components/Navbari";
import { db , auth } from "../firebase"; // Import Firebase configurations
import { collection, getDocs, doc, updateDoc, setDoc , query, where} from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";

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

 // Fetch FIRs assigned to the logged-in investigator
   useEffect(() => {
     const fetchFirs = async () => {
       setLoading(true); // Indicate loading state
       const user = auth.currentUser;
   
       if (!user) {
         toast.error("Please log in to view your cases.");
         
         setLoading(false);
         return;
       }
   
       try {
         const q = query(
           collection(db, "firs"),
           where("assignedInvestigator", "==", user.uid) // Fetch only assigned FIRs
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
     };
   
     fetchFirs();
   }, [auth.currentUser]); // Added dependency to refetch if user changes
   

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
            setInvestigationData({}); // Initialize empty if no data exists
          }
        } catch (error) {
          toast.error("Failed to fetch investigation data");
          console.error("Error fetching investigation data:", error);
        }
      };

      fetchInvestigationData();
    }
  }, [activeCaseId]);

  // Handle "Start Solving Case" button click
  const handleStartSolvingCase = (firId) => {
    setActiveCaseId(firId);
    setShowInvestigationForm(true);
  };

  // Handle form input changes
  const handleInputChange = (phaseIndex, stepIndex, value) => {
    const updatedData = { ...investigationData };
    if (!updatedData[phaseIndex]) updatedData[phaseIndex] = [];
    updatedData[phaseIndex][stepIndex] = value;
    setInvestigationData(updatedData);
  };

  // Calculate progress
  const calculateProgress = () => {
    let completedSteps = 0;
    investigationSteps.forEach((phase, phaseIndex) => {
      phase.steps.forEach((_, stepIndex) => {
        if (investigationData[phaseIndex]?.[stepIndex]) {
          completedSteps++;
        }
      });
    });
    return (completedSteps / 40) * 100; // Total steps are 40
  };

  // Save investigation data to Firestore
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

  // Change FIR status in Firestore
  const handleChangeStatus = async (firId, newStatus) => {
    try {
      await updateDoc(doc(db, "firs", firId), { status: newStatus });
      setFirs((prev) =>
        prev.map((f) => (f.id === firId ? { ...f, status: newStatus } : f))
      );
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Handle view details
  const handleViewDetails = (fir) => {
    setSelectedFIR(fir);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedFIR(null);
  };

  // Get status color based on FIR status
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

  // Render FIRs by status
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
          <div className="mt-4">
            <select
              value={fir.status}
              onChange={(e) => handleChangeStatus(fir.id, e.target.value)}
              className="p-2 border rounded"
            >
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Rejected">Rejected</option>
              <option value="Solved">Solved</option>
            </select>
          </div>
        </div>
      ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-300">
      <Headeri />
      <Navbari />
      <ToastContainer position="top-right" autoClose={3000} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 mt-8">
          FIR Cases Management System
        </h1>

        <div className="mt-12">
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
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

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Active Cases ({firs.filter((f) => f.status === "Active").length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderFIRsByStatus("Active")}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Closed Cases ({firs.filter((f) => f.status === "Solved").length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderFIRsByStatus("Solved")}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Rejected Cases ({firs.filter((f) => f.status === "Rejected").length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderFIRsByStatus("Rejected")}
            </div>
          </div>
        </div>
      </main>

      {/* Investigation Form Modal */}
      {showInvestigationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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