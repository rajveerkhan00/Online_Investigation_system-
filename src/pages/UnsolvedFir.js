import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Headeri from "../components/Headeri";
import Footer from "../components/Footeri";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc, query, where, getDoc } from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";
import { ChevronDown, Calendar, Flag,  FileText } from "lucide-react";
import InveNot from "../components/InveNot";
import { useNavigate } from "react-router-dom";


const FIRSubmission = () => {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [investigationData, setInvestigationData] = useState({});
  const [investigationSteps, setInvestigationSteps] = useState([]);
  const [stepsSource, setStepsSource] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");
  const [oldStatus, setOldStatus] = useState("");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [activeCaseType, setActiveCaseType] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  // Session timeout functionality
  useEffect(() => {
    const checkAuthState = () => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivity;
      const timeoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (inactiveTime > timeoutDuration) {
        // User has been inactive for more than 5 minutes
        auth.signOut().then(() => {
          toast.info("Session expired due to inactivity. Please log in again.");
          navigate("/investigator/login");
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab is active again, check if we need to log out
        checkAuthState();
      } else {
        // Tab is inactive, update last activity time
        setLastActivity(Date.now());
      }
    };

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Check auth state every minute
    const interval = setInterval(checkAuthState, 60 * 1000);

    return () => {
      // Clean up event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity, navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);

      if (!user) {
        // Only redirect if this is not a page reload
        if (performance.navigation.type !== performance.navigation.TYPE_RELOAD) {
          toast.error("Please log in to view your cases.");
          navigate("/user/login");
        }
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

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (activeCaseId) {
      const fetchInvestigationData = async () => {
        try {
          const investigationDoc = await getDoc(doc(db, "investigations", activeCaseId));
          if (investigationDoc.exists()) {
            setInvestigationData(investigationDoc.data().data || {});
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

  const getInvestigationSteps = async (caseId, incidentType) => {
    try {
      // First try to get generated steps from Firestore
      const investigationDoc = await getDoc(doc(db, "investigations", incidentType));
      
      if (investigationDoc.exists()) {
        return {
          steps: investigationDoc.data().steps,
          source: investigationDoc.data().isDefault ? "default" : "generated",
          firId: investigationDoc.data().firId || null
        };
      }

      // If not found, try to generate new steps using Gemini API
      try {
        const generatedSteps = await generateInvestigationSteps(incidentType);
        
        if (generatedSteps && generatedSteps.length > 0) {
          // Save the generated steps for future use
          await setDoc(doc(db, "investigations", incidentType), {
            steps: generatedSteps,
            firId: caseId,
            createdAt: new Date(),
            isDefault: false,
            lastGenerated: new Date()
          });
          return {
            steps: generatedSteps,
            source: "generated",
            firId: caseId
          };
        }
      } catch (error) {
        console.error("Failed to generate steps, using defaults. Error:", error.message);
        // Save error information for debugging
        await setDoc(doc(db, "generationErrors", `${incidentType}_${Date.now()}`), {
          incidentType,
          firId: caseId,
          error: error.message,
          timestamp: new Date()
        });
      }

      // Fall back to default steps if generation fails
      await setDoc(doc(db, "investigations", incidentType), {
        steps: DEFAULT_INVESTIGATION_STEPS,
        firId: caseId,
        isDefault: true,
        createdAt: new Date(),
        usedDefault: true
      });
      
      return {
        steps: DEFAULT_INVESTIGATION_STEPS,
        source: "default",
        firId: caseId
      };
    } catch (error) {
      console.error("Error getting investigation steps:", error);
      return {
        steps: DEFAULT_INVESTIGATION_STEPS,
        source: "default",
        firId: caseId,
        error: error.message
      };
    }
  };

  const generateInvestigationSteps = async (incidentType) => {
    // This would be replaced with actual API call to Gemini or similar service
    // For now, we'll return the default steps
    return DEFAULT_INVESTIGATION_STEPS;
  };

  const generateNewSteps = async (caseId, incidentType) => {
    try {
      const generatedSteps = await generateInvestigationSteps(incidentType);
      
      if (generatedSteps && generatedSteps.length > 0) {
        await setDoc(doc(db, "investigations", incidentType), {
          steps: generatedSteps,
          firId: caseId,
          createdAt: new Date(),
          isDefault: false,
          lastGenerated: new Date()
        });
        return {
          steps: generatedSteps,
          source: "generated",
          firId: caseId
        };
      }
      throw new Error("Failed to generate steps: empty response");
    } catch (error) {
      console.error("Error generating new steps:", error);
      // Save error information for debugging
      await setDoc(doc(db, "generationErrors", `${incidentType}_${Date.now()}`), {
        incidentType,
        firId: caseId,
        error: error.message,
        timestamp: new Date(),
        action: "manual-regeneration"
      });
      throw error;
    }
  };

  const saveInvestigationProgress = async (caseId, data) => {
    try {
      await setDoc(doc(db, "investigations", caseId), {
        firId: caseId,
        data: data,
        updatedAt: new Date()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving investigation progress:", error);
      throw error;
    }
  };

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
        unsolvedReason: null
      });

      setFirs((prev) =>
        prev.map((f) => {
          if (f.id === currentCaseId) {
            const updatedFir = {
              ...f,
              status: "Active",
              reopenReason: reasonText
            };
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

  const handleStartSolvingCase = async (firId, incidentType) => {
    setActiveCaseId(firId);
    setActiveCaseType(incidentType);
    try {
      setLoading(true);
      const { steps, source } = await getInvestigationSteps(firId, incidentType);
      if (!steps || !Array.isArray(steps)) {
        throw new Error("Invalid steps data received");
      }
      setInvestigationSteps(steps);
      setStepsSource(source);
      setShowInvestigationForm(true);
    } catch (error) {
      toast.error("Failed to load investigation steps");
      console.error("Error loading investigation steps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewSteps = async () => {
    try {
      setGeneratingSteps(true);
      const { steps, source, error } = await generateNewSteps(activeCaseId, activeCaseType);
      
      if (error || !steps || !Array.isArray(steps)) {
        throw new Error(error || "Invalid steps data received");
      }

      setInvestigationSteps(steps);
      setStepsSource(source);
      toast.success("Successfully generated new investigation steps");
    } catch (error) {
      console.error("Error generating new steps:", error);
      toast.error(`Failed to generate steps: ${error.message}`);
    } finally {
      setGeneratingSteps(false);
    }
  };

  const handleInputChange = (phaseIndex, stepIndex, value) => {
    const updatedData = { ...investigationData };
    if (!updatedData[phaseIndex]) updatedData[phaseIndex] = [];
    updatedData[phaseIndex][stepIndex] = value;
    setInvestigationData(updatedData);
  };

  const calculateProgress = () => {
    if (!investigationSteps || !Array.isArray(investigationSteps)) return 0;
    
    let completedSteps = 0;
    let totalSteps = 0;

    investigationSteps.forEach((phase, phaseIndex) => {
      if (phase?.steps && Array.isArray(phase.steps)) {
        phase.steps.forEach((_, stepIndex) => {
          totalSteps++;
          if (investigationData?.[phaseIndex]?.[stepIndex]) {
            completedSteps++;
          }
        });
      }
    });

    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  const handleSaveInvestigation = async () => {
    setSaveLoading(true);
    try {
      await saveInvestigationProgress(activeCaseId, investigationData);

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
    if (!firs || !Array.isArray(firs)) return [];
    
    return [...firs].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.incidentDateTime || 0) - new Date(b.incidentDateTime || 0);
      } else if (sortBy === "priority") {
        return (a.priority || 0) - (b.priority || 0);
      }
      return 0;
    });
  };

  const renderFIRsByStatus = (status) => {
    const filteredFirs = firs.filter((fir) => fir?.status === status);
    const sortedFirs = sortFirs(filteredFirs, sortBy);

    if (sortedFirs.length === 0) {
      return <div className="text-gray-500">No {status} cases found</div>;
    }

    return sortedFirs.map((fir) => (
      <div key={fir.id} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{fir.complainantName || 'N/A'}</h3>
            <p className="text-sm text-gray-600">{fir.incidentType || 'N/A'}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${getStatusColor(fir.status)}`}
          >
            {fir.status || 'N/A'}
          </span>
        </div>
        <p className="text-gray-700 mb-2">
          {fir.incidentDateTime ? new Date(fir.incidentDateTime).toLocaleString() : 'N/A'}
        </p>
        <p className="text-gray-600 truncate">{fir.incidentDescription || 'No description'}</p>
        <div className="mt-4 flex space-x-2">
          {fir.supportingDocuments?.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Document ${index + 1}`}
              className="w-16 h-16 object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/64?text=Document";
              }}
            />
          ))}
        </div>
        
        {(fir.status === "Rejected" || fir.status === "UnSolved") && fir[`${fir.status.toLowerCase()}Reason`] && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-semibold">{fir.status} Reason:</p>
            <p>{fir[`${fir.status.toLowerCase()}Reason`]}</p>
          </div>
        )}
        
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
              onClick={() => handleStartSolvingCase(fir.id, fir.incidentType)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Solving Case
            </button>
          )}
        </div>
        <div className="mt-4">
          <select
            value={fir.status || ''}
            onChange={(e) => handleChangeStatus(fir.id, e.target.value, fir.status)}
            className="p-2 border rounded"
          >
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Solved">Solved</option>
            <option value="UnSolved">UnSolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
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
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-200">
  <Headeri />
  <InveNot />
  <ToastContainer position="top-right" autoClose={3000} />

  <main className="flex-grow container mx-auto px-4 py-8">
   <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-semibold text-center mb-6 sm:mb-8 mt-4 sm:mt-8 font-serif tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600">
  All Unsolved FIR
</h1>

    
   <div className="flex justify-center sm:justify-end mb-4 sm:mb-6 px-2 sm:px-4">
  <div className="relative w-40 sm:w-48">
    <button
      onClick={() => setShowSortDropdown(!showSortDropdown)}
      className="flex items-center justify-between gap-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white px-3 py-2 rounded-md shadow-md hover:from-blue-800 hover:to-blue-700 transition-all duration-300 w-full text-xs sm:text-sm font-medium"
    >
      Sort Options
      <ChevronDown
        size={14}
        className="transition-transform duration-200"
        style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'none' }}
      />
    </button>

    {showSortDropdown && (
      <div className="absolute right-0 mt-1 w-full sm:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 animate-fade-in">
        <button
          onClick={() => {
            setSortBy("date");
            setShowSortDropdown(false);
          }}
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition duration-200 border-b border-gray-100"
        >
          <Calendar size={14} className="text-blue-600" /> Sort by Date
        </button>
        <button
          onClick={() => {
            setSortBy("priority");
            setShowSortDropdown(false);
          }}
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition duration-200"
        >
          <Flag size={14} className="text-red-600" /> Sort by Priority
        </button>
      </div>
    )}
  </div>
</div>

    
    <div className="mt-12 space-y-16">
      
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-1 bg-red-500 rounded-full"></div>
          <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-800 font-sans">
            UnSolved Cases <span className="text-red-600">({firs.filter((f) => f?.status === "UnSolved").length})</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderFIRsByStatus("UnSolved")}
        </div>
      </div>
</div>
  </main>

  {/* Modals remain the same but with enhanced colors */}
  {showReasonModal && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Provide Reason for {currentStatus}</h2>
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={5}
          placeholder={`Enter reason for marking this case as ${currentStatus}...`}
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowReasonModal(false)}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveReason}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            Save Reason
          </button>
        </div>
      </div>
    </div>
  )}

  {showReopenModal && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Provide Reason for Reopening Case</h2>
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={5}
          placeholder="Enter reason for reopening this case..."
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowReopenModal(false)}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleReopenCase}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors font-medium shadow-md"
          >
            Reopen Case
          </button>
        </div>
      </div>
    </div>
  )}

  {showInvestigationForm && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative pb-20 shadow-2xl border border-gray-200">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Investigation Form</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <TailSpin color="#3b82f6" height={60} width={60} />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6 bg-blue-50 p-4 rounded-xl">
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Investigation Progress: <span className="text-blue-600">{calculateProgress().toFixed(2)}%</span>
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
              {stepsSource === "default" && (
                <button
                  onClick={handleGenerateNewSteps}
                  disabled={generatingSteps}
                  className="ml-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center shadow-md whitespace-nowrap"
                >
                  {generatingSteps ? (
                    <>
                      <TailSpin color="#ffffff" height={20} width={20} className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate New Steps"
                  )}
                </button>
              )}
            </div>
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800 font-medium">
                {stepsSource === "generated" 
                  ? "🔍 These steps were dynamically generated for this case type." 
                  : stepsSource === "default" 
                    ? "ℹ️ Using default investigation steps (could not generate specific steps)." 
                    : "Loading investigation steps..."}
              </p>
            </div>
            {investigationSteps.map((phase, phaseIndex) => (
              <div key={phaseIndex} className="mb-8 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{phaseIndex + 1}</span>
                  {phase?.phase || `Phase ${phaseIndex + 1}`}
                </h3>
                {phase?.steps?.map((step, stepIndex) => (
                  <div key={stepIndex} className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {step || `Step ${stepIndex + 1}`}
                    </label>
                    <textarea
                      value={investigationData[phaseIndex]?.[stepIndex] || ""}
                      onChange={(e) =>
                        handleInputChange(phaseIndex, stepIndex, e.target.value)
                      }
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            ))}
            
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
              <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                <button
                  onClick={() => setShowInvestigationForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInvestigation}
                  disabled={saveLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium shadow-md flex items-center justify-center"
                >
                  {saveLoading ? (
                    <>
                      <TailSpin color="#ffffff" height={20} width={20} className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Investigation"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )}

  {showModal && selectedFIR && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">FIR Details</h2>

        <div className="space-y-8">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">Complainant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700"><span className="font-medium">Name:</span> {selectedFIR.complainantName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">Contact Number:</span> {selectedFIR.contactNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {selectedFIR.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
            <h3 className="text-xl font-semibold mb-4 text-yellow-800">Incident Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700"><span className="font-medium">Type:</span> {selectedFIR.incidentType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">Date & Time:</span> {selectedFIR.incidentDateTime ? new Date(selectedFIR.incidentDateTime).toLocaleString() : 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-700"><span className="font-medium">Description:</span> {selectedFIR.incidentDescription || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-5 rounded-xl border border-green-100">
            <h3 className="text-xl font-semibold mb-4 text-green-800">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700"><span className="font-medium">Address:</span> {selectedFIR.incidentLocation?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">City:</span> {selectedFIR.incidentLocation?.city || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">State:</span> {selectedFIR.incidentLocation?.state || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">GPS Coordinates:</span> {selectedFIR.incidentLocation?.gpsCoordinates || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-5 rounded-xl border border-red-100">
            <h3 className="text-xl font-semibold mb-4 text-red-800">Suspect Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700"><span className="font-medium">Name:</span> {selectedFIR.suspectDetails?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">Description:</span> {selectedFIR.suspectDetails?.description || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-700"><span className="font-medium">Known Address:</span> {selectedFIR.suspectDetails?.knownAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
            <h3 className="text-xl font-semibold mb-4 text-purple-800">Witness Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700"><span className="font-medium">Name:</span> {selectedFIR.witnessDetails?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><span className="font-medium">Contact:</span> {selectedFIR.witnessDetails?.contact || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Supporting Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedFIR.supportingDocuments?.length > 0 ? (
                selectedFIR.supportingDocuments.map((url, index) => (
                  <a 
                    key={index} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-blue-600 font-medium">Document {index + 1}</span>
                  </a>
                ))
              ) : (
                <p className="text-gray-500">No supporting documents</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="mt-8 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium w-full sm:w-auto"
        >
          Close Details
        </button>
      </div>
    </div>
  )}
  <Footer />
</div>
  );
};

export default FIRSubmission;