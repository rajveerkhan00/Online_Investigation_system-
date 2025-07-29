import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";
import { 
  ChevronDown, 
  Calendar, 
  Flag, 
  Search, 
  Filter, 
  User, 
  FileText, 
  MapPin, 
  AlertCircle,
  Send,
  Trash2,
  Check,
  X,
  ClipboardList
} from "lucide-react";
import AdminHeader from "../components/HeaderA";

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

const AdminDetails = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [investigators, setInvestigators] = useState([]);
  const [assigningInvestigator, setAssigningInvestigator] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInvestigator, setSelectedInvestigator] = useState("");
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [investigationSteps, setInvestigationSteps] = useState(DEFAULT_INVESTIGATION_STEPS);
  const [investigationData, setInvestigationData] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadingInvestigationSteps, setLoadingInvestigationSteps] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const casesQuery = query(collection(db, "firs"));
        const casesSnapshot = await getDocs(casesQuery);
        const casesData = casesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCases(casesData);

        const investigatorsQuery = query(collection(db, "investigatordata"));
        const investigatorsSnapshot = await getDocs(investigatorsQuery);
        const investigatorsData = investigatorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvestigators(investigatorsData);
      } catch (error) {
        toast.error("Failed to fetch data");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (showInvestigationForm && selectedCase) {
      const loadInvestigationData = async () => {
        try {
          setLoadingInvestigationSteps(true);
          const investigationDocRef = doc(db, "investigations", selectedCase.id);
          const investigationDocSnap = await getDoc(investigationDocRef);

          if (investigationDocSnap.exists()) {
            const investigationDocData = investigationDocSnap.data();
            const fetchedInvestigationData = investigationDocData.data || [];
            setInvestigationData(fetchedInvestigationData);
            const defaultSteps = DEFAULT_INVESTIGATION_STEPS.map(phase =>
              phase.steps.map(() => "")
            );
            setInvestigationSteps(DEFAULT_INVESTIGATION_STEPS);
          } else {
            setInvestigationSteps(DEFAULT_INVESTIGATION_STEPS);
            const initialData = DEFAULT_INVESTIGATION_STEPS.map(phase =>
              phase.steps.map(() => "")
            );
            setInvestigationData(initialData);
          }
        } catch (error) {
          console.error("Error loading investigation data:", error);
          toast.error("Failed to load investigation data");
          setInvestigationSteps(DEFAULT_INVESTIGATION_STEPS);
          const initialData = DEFAULT_INVESTIGATION_STEPS.map(phase =>
            phase.steps.map(() => "")
          );
          setInvestigationData(initialData);
        } finally {
          setLoadingInvestigationSteps(false);
        }
      };

      loadInvestigationData();
    }
  }, [showInvestigationForm, selectedCase]);

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

  const sortCases = (cases, sortBy) => {
    return [...cases].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.incidentDateTime) - new Date(a.incidentDateTime);
      } else if (sortBy === "priority") {
        return (b.priority || 0) - (a.priority || 0);
      }
      return 0;
    });
  };

  const filteredCases = React.useMemo(() => {
    let result = cases;
    if (statusFilter !== "All") {
      result = result.filter(c => c.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.complainantName?.toLowerCase().includes(term) ||
        c.incidentType?.toLowerCase().includes(term) ||
        c.incidentLocation?.city?.toLowerCase().includes(term) ||
        c.contactNumber?.includes(searchTerm)
      );
    }
    return sortCases(result, sortBy);
  }, [cases, statusFilter, searchTerm, sortBy]);

  const calculateProgress = () => {
    if (!investigationData.length) return 0;
    let totalSteps = 0;
    let completedSteps = 0;
    investigationData.forEach((phase, phaseIndex) => {
      phase.forEach((step, stepIndex) => {
        totalSteps++;
        if (step && step.trim() !== "") {
          completedSteps++;
        }
      });
    });
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  };

  const handleInputChange = (phaseIndex, stepIndex, value) => {
    const newData = [...investigationData];
    if (!newData[phaseIndex]) newData[phaseIndex] = [];
    newData[phaseIndex][stepIndex] = value;
    setInvestigationData(newData);
  };

  const handleSaveInvestigation = async () => {
    if (!selectedCase) return;
    try {
      setSaveLoading(true);
      await setDoc(doc(db, "caseInvestigations", selectedCase.id), {
        firId: selectedCase.id,
        incidentType: selectedCase.incidentType,
        data: investigationData,
        updatedAt: new Date(),
        progress: calculateProgress()
      });
      toast.success("Investigation saved successfully");
    } catch (error) {
      console.error("Error saving investigation:", error);
      toast.error("Failed to save investigation");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setShowCaseModal(true);
  };

  const closeCaseModal = () => {
    setShowCaseModal(false);
    setSelectedCase(null);
  };

  const handleDeleteCase = (caseId) => {
    setCaseToDelete(caseId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCase = async () => {
    if (!caseToDelete) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, "firs", caseToDelete));
      await deleteDoc(doc(db, "caseInvestigations", caseToDelete));
      setCases(prev => prev.filter(c => c.id !== caseToDelete));
      toast.success("Case deleted successfully");
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Failed to delete case");
      console.error("Error deleting case:", error);
    } finally {
      setDeleting(false);
      setCaseToDelete(null);
    }
  };

  const handleSendMessage = (caseData) => {
    setSelectedCase(caseData);
    setMessageText("");
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!selectedCase?.assignedInvestigator || !messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      setSendingMessage(true);
      await addDoc(collection(db, "adminalerts"), {
        investigatorId: selectedCase.assignedInvestigator,
        message: messageText.trim(),
        firId: selectedCase.id,
        caseTitle: selectedCase.incidentType || "Case",
        createdAt: serverTimestamp(),
        read: false,
        status: "unread",
        from: "admin"
      });
      toast.success("Message sent successfully");
      setShowMessageModal(false);
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignInvestigator = (caseData) => {
    setSelectedCase(caseData);
    setSelectedInvestigator(caseData.assignedInvestigator || "");
    setShowAssignModal(true);
  };

  const assignInvestigator = async () => {
    if (!selectedCase?.id) return;
    try {
      setAssigningInvestigator(true);
      await updateDoc(doc(db, "firs", selectedCase.id), {
        assignedInvestigator: selectedInvestigator || null,
        status: selectedInvestigator ? "Active" : "Pending"
      });
      setCases(prev => prev.map(c => 
        c.id === selectedCase.id 
          ? { 
              ...c, 
              assignedInvestigator: selectedInvestigator || null,
              status: selectedInvestigator ? "Active" : "Pending"
            } 
          : c
      ));
      toast.success("Investigator assigned successfully");
      setShowAssignModal(false);
    } catch (error) {
      toast.error("Failed to assign investigator");
      console.error("Error assigning investigator:", error);
    } finally {
      setAssigningInvestigator(false);
    }
  };

  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      await updateDoc(doc(db, "firs", caseId), {
        status: newStatus
      });
      setCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, status: newStatus } : c
      ));
      toast.success(`Case status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update case status");
      console.error("Error updating status:", error);
    }
  };

  const getInvestigatorName = (investigatorId) => {
    if (!investigatorId) return "Not assigned";
    const investigator = investigators.find(i => i.id === investigatorId);
    return investigator ? `${investigator.realName} (@${investigator.username})` : "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex flex-col lg:flex-row">
        <main className="flex-1 p-2 sm:p-4 md:p-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Case Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">View and manage all FIR cases</p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 text-sm"
                  >
                    <Filter size={16} />
                    Sort
                    <ChevronDown size={16} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <button
                        onClick={() => {
                          setSortBy("date");
                          setShowSortDropdown(false);
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left ${sortBy === "date" ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'} text-sm`}
                      >
                        <Calendar size={16} /> By Date
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("priority");
                          setShowSortDropdown(false);
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left ${sortBy === "priority" ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'} text-sm`}
                      >
                        <Flag size={16} /> By Priority
                      </button>
                    </div>
                  )}
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Solved">Solved</option>
                  <option value="UnSolved">UnSolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col items-center">
              <div className="text-gray-500 text-xs sm:text-sm">Total Cases</div>
              <div className="text-lg sm:text-2xl font-bold">{cases.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col items-center">
              <div className="text-gray-500 text-xs sm:text-sm">Pending</div>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {cases.filter(c => c.status === "Pending").length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col items-center">
              <div className="text-gray-500 text-xs sm:text-sm">Active</div>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {cases.filter(c => c.status === "Active").length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col items-center">
              <div className="text-gray-500 text-xs sm:text-sm">Solved</div>
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {cases.filter(c => c.status === "Solved").length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col items-center">
              <div className="text-gray-500 text-xs sm:text-sm">UnSolved/Rejected</div>
              <div className="text-lg sm:text-2xl font-bold text-red-600">
                {cases.filter(c => c.status === "UnSolved" || c.status === "Rejected").length}
              </div>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8 sm:p-12">
                <TailSpin color="#3b82f6" height={40} width={40} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Complainant</th>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Incident</th>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Investigator</th>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCases.length > 0 ? (
                      filteredCases.map((caseItem) => (
                        <tr key={caseItem.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {caseItem.id.substring(0, 8)}...
                          </td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{caseItem.complainantName}</div>
                            <div className="text-gray-500">{caseItem.contactNumber}</div>
                          </td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{caseItem.incidentType}</div>
                            <div className="text-gray-500 truncate max-w-xs">
                              {caseItem.incidentDescription}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                            {getInvestigatorName(caseItem.assignedInvestigator)}
                          </td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                              {caseItem.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                            {new Date(caseItem.incidentDateTime).toLocaleDateString()}
                          </td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap font-medium">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <button
                                onClick={() => handleViewCase(caseItem)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <FileText size={16} />
                              </button>
                              {caseItem.assignedInvestigator && (
                                <button
                                  onClick={() => handleSendMessage(caseItem)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Send Message"
                                >
                                  <Send size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleAssignInvestigator(caseItem)}
                                className="text-green-600 hover:text-green-900"
                                title="Assign Investigator"
                              >
                                <User size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowInvestigationForm(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Investigation Form"
                              >
                                <ClipboardList size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCase(caseItem.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Case"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-2 sm:px-6 py-8 text-center">
                          <div className="text-gray-500">
                            {cases.length === 0 ? (
                              <>
                                <p className="font-medium">No cases found</p>
                                <p className="text-sm mt-1">No FIR cases have been submitted yet.</p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">No matching cases found</p>
                                <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Case Details Modal */}
      {showCaseModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-lg sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 gap-2">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Case Details</h2>
                <p className="text-gray-600 text-xs sm:text-sm">Case ID: {selectedCase.id}</p>
              </div>
              <button
                onClick={closeCaseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <User size={18} /> Complainant Information
                </h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <p><strong>Name:</strong> {selectedCase.complainantName || "N/A"}</p>
                  <p><strong>Contact:</strong> {selectedCase.contactNumber || "N/A"}</p>
                  <p><strong>Email:</strong> {selectedCase.email || "N/A"}</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <FileText size={18} /> Incident Details
                </h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <p><strong>Type:</strong> {selectedCase.incidentType || "N/A"}</p>
                  <p><strong>Date/Time:</strong> {new Date(selectedCase.incidentDateTime).toLocaleString() || "N/A"}</p>
                  <p><strong>Description:</strong> {selectedCase.incidentDescription || "N/A"}</p>
                </div>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <MapPin size={18} /> Location Details
                </h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <p><strong>Address:</strong> {selectedCase.incidentLocation?.address || "N/A"}</p>
                  <p><strong>City:</strong> {selectedCase.incidentLocation?.city || "N/A"}</p>
                  <p><strong>State:</strong> {selectedCase.incidentLocation?.state || "N/A"}</p>
                  <p><strong>GPS:</strong> {selectedCase.incidentLocation?.gpsCoordinates || "N/A"}</p>
                </div>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <User size={18} /> Investigator & Status
                </h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <p><strong>Assigned To:</strong> {getInvestigatorName(selectedCase.assignedInvestigator)}</p>
                  <p>
                    <strong>Status:</strong>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </p>
                  {selectedCase.rejectedReason && (
                    <p><strong>Rejection Reason:</strong> {selectedCase.rejectedReason}</p>
                  )}
                  {selectedCase.unsolvedReason && (
                    <p><strong>UnSolved Reason:</strong> {selectedCase.unsolvedReason}</p>
                  )}
                  {selectedCase.reopenReason && (
                    <p><strong>Reopen Reason:</strong> {selectedCase.reopenReason}</p>
                  )}
                </div>
              </div>
            </div>

            {selectedCase.supportingDocuments?.length > 0 && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Supporting Documents</h3>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {selectedCase.supportingDocuments.map((url, index) => (
                    <div key={index} className="border rounded p-1 sm:p-2">
                      <img
                        src={url}
                        alt={`Document ${index + 1}`}
                        className="w-20 h-20 sm:w-32 sm:h-32 object-contain"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-blue-600 text-xs sm:text-sm mt-1"
                      >
                        View Full
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCase.status}
                  onChange={(e) => updateCaseStatus(selectedCase.id, e.target.value)}
                  className="p-2 border rounded bg-white text-xs sm:text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Solved">Solved</option>
                  <option value="UnSolved">UnSolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                {selectedCase.assignedInvestigator && (
                  <button
                    onClick={() => handleSendMessage(selectedCase)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-xs sm:text-sm"
                  >
                    <Send size={16} /> Send Message
                  </button>
                )}
                <button
                  onClick={() => handleAssignInvestigator(selectedCase)}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-xs sm:text-sm"
                >
                  <User size={16} /> Assign Investigator
                </button>
                <button
                  onClick={() => {
                    setShowInvestigationForm(true);
                    setShowCaseModal(false);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 text-xs sm:text-sm"
                >
                  <ClipboardList size={16} /> Investigation Form
                </button>
              </div>
              <button
                onClick={closeCaseModal}
                className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-xs sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-xs sm:max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 flex items-center gap-2">
              <Send size={20} /> Send Message to Investigator
            </h2>
            <p className="mb-1 sm:mb-2 text-xs sm:text-sm">
              <strong>Investigator:</strong> {getInvestigatorName(selectedCase.assignedInvestigator)}
            </p>
            <p className="mb-2 sm:mb-4 text-xs sm:text-sm">
              <strong>Case:</strong> {selectedCase.incidentType} ({selectedCase.id.substring(0, 8)}...)
            </p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-2 sm:p-3 border rounded mb-2 sm:mb-4 text-xs sm:text-sm"
              rows={4}
              placeholder="Type your message here..."
            />
            <div className="flex justify-end space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={sendingMessage || !messageText.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 text-xs sm:text-sm"
              >
                {sendingMessage ? (
                  <TailSpin color="#FFFFFF" height={20} width={20} />
                ) : (
                  <>
                    <Send size={16} /> Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-xs sm:max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" /> Confirm Deletion
            </h2>
            <p className="mb-2 sm:mb-4 text-xs sm:text-sm">Are you sure you want to delete this case? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCase}
                disabled={deleting}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 flex items-center gap-2 text-xs sm:text-sm"
              >
                {deleting ? (
                  <TailSpin color="#FFFFFF" height={20} width={20} />
                ) : (
                  <>
                    <Trash2 size={16} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Investigator Modal */}
      {showAssignModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-xs sm:max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 flex items-center gap-2">
              <User size={20} /> Assign Investigator
            </h2>
            <p className="mb-1 sm:mb-2 text-xs sm:text-sm">
              <strong>Case:</strong> {selectedCase.incidentType} ({selectedCase.id.substring(0, 8)}...)
            </p>
            <div className="mb-2 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Select Investigator</label>
              <select
                value={selectedInvestigator}
                onChange={(e) => setSelectedInvestigator(e.target.value)}
                className="w-full p-2 border rounded text-xs sm:text-sm"
              >
                <option value="">-- Unassign --</option>
                {investigators.map(investigator => (
                  <option key={investigator.id} value={investigator.id}>
                    {investigator.realName} (@{investigator.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={assignInvestigator}
                disabled={assigningInvestigator}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2 text-xs sm:text-sm"
              >
                {assigningInvestigator ? (
                  <TailSpin color="#FFFFFF" height={20} width={20} />
                ) : (
                  <>
                    <Check size={16} /> Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Form Modal */}
      {showInvestigationForm && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-3 sm:p-8 max-w-xs sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <h2 className="text-lg sm:text-2xl font-bold">Investigation Form</h2>
              <button
                onClick={() => setShowInvestigationForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {loadingInvestigationSteps ? (
              <div className="flex justify-center items-center p-8 sm:p-12">
                <TailSpin color="#3b82f6" height={40} width={40} />
              </div>
            ) : (
              <>
                <div className="mb-2 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                    Progress: {calculateProgress().toFixed(2)}%
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mb-1 sm:mb-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>Case Type:</strong> {selectedCase.incidentType}
                  </p>
                </div>
                {investigationSteps.map((phase, phaseIndex) => (
                  <div key={phaseIndex} className="mb-3 sm:mb-6">
                    <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">{phase.phase}</h3>
                    {phase.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="mb-2 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                          {step}
                        </label>
                        <textarea
                          value={investigationData[phaseIndex]?.[stepIndex] || ""}
                          onChange={(e) =>
                            handleInputChange(phaseIndex, stepIndex, e.target.value)
                          }
                          className="mt-1 p-2 w-full border rounded-md text-xs sm:text-sm"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                  <button
                    onClick={handleSaveInvestigation}
                    disabled={saveLoading}
                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-xs sm:text-sm"
                  >
                    {saveLoading ? (
                      <>
                        <TailSpin color="#FFFFFF" height={20} width={20} className="mr-2" />
                        Saving...
                      </>
                    ) : "Save Investigation"}
                  </button>
                  <button
                    onClick={() => setShowInvestigationForm(false)}
                    className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-xs sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminDetails;