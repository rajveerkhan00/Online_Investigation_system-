import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { TailSpin } from "react-loader-spinner";
import { ChevronDown, Calendar, Flag, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TotalCases = () => {
  const [cases, setCases] = useState([]);
  const [investigators, setInvestigators] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "incidentDateTime",
    direction: "desc",
  });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First fetch all cases
        const casesQuery = query(collection(db, "firs"), orderBy(sortConfig.key, sortConfig.direction));
        const casesSnapshot = await getDocs(casesQuery);
        const casesData = [];
        const investigatorIds = new Set();
        
        casesSnapshot.forEach((doc) => {
          const data = doc.data();
          casesData.push({ id: doc.id, ...data });
          if (data.assignedInvestigator) {
            investigatorIds.add(data.assignedInvestigator);
          }
        });
        
        // Then fetch all investigators to map details to IDs
        const investigatorsQuery = query(collection(db, "investigatordata"));
        const investigatorsSnapshot = await getDocs(investigatorsQuery);
        const investigatorsData = {};
        
        investigatorsSnapshot.forEach((doc) => {
          const data = doc.data();
          // Map the document ID (uid) to the investigator's details
          investigatorsData[doc.id] = {
            realName: data.realName || "Unknown",
            username: data.username || "N/A"
          };
        });
        
        setInvestigators(investigatorsData);
        setCases(casesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load cases");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortConfig]);

  const openModal = (fir) => {
    setSelectedFIR(fir);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFIR(null);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    
    try {
      setDeletingId(id);
      await deleteDoc(doc(db, "firs", id));
      setCases(cases.filter(caseItem => caseItem.id !== id));
      toast.success("Case deleted successfully");
    } catch (error) {
      console.error("Error deleting case:", error);
      toast.error("Failed to delete case");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCases = cases.filter((fir) => {
    const searchLower = searchTerm.toLowerCase();
    const investigator = fir.assignedInvestigator ? investigators[fir.assignedInvestigator] : null;
    const investigatorName = investigator ? investigator.realName.toLowerCase() : "";
    const investigatorUsername = investigator ? investigator.username.toLowerCase() : "";
    
    return (
      fir.complainantName?.toLowerCase().includes(searchLower) ||
      fir.incidentType?.toLowerCase().includes(searchLower) ||
      fir.incidentLocation?.city?.toLowerCase().includes(searchLower) ||
      fir.status?.toLowerCase().includes(searchLower) ||
      investigatorName.includes(searchLower) ||
      investigatorUsername.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <TailSpin color="#3B82F6" height={80} width={80} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Total Cases</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search cases..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredCases.length} of {cases.length} cases
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("complainantName")}
                  >
                    <div className="flex items-center">
                      Complainant
                      <ChevronDown
                        className={`ml-1 h-4 w-4 ${
                          sortConfig.key === "complainantName" ? "text-blue-500" : "text-gray-400"
                        } ${
                          sortConfig.key === "complainantName" && sortConfig.direction === "asc"
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("incidentType")}
                  >
                    <div className="flex items-center">
                      Incident Type
                      <ChevronDown
                        className={`ml-1 h-4 w-4 ${
                          sortConfig.key === "incidentType" ? "text-blue-500" : "text-gray-400"
                        } ${
                          sortConfig.key === "incidentType" && sortConfig.direction === "asc"
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Assigned Investigator
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("incidentLocation.city")}
                  >
                    <div className="flex items-center">
                      Location
                      <ChevronDown
                        className={`ml-1 h-4 w-4 ${
                          sortConfig.key === "incidentLocation.city" ? "text-blue-500" : "text-gray-400"
                        } ${
                          sortConfig.key === "incidentLocation.city" && sortConfig.direction === "asc"
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("incidentDateTime")}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                      Date/Time
                      <ChevronDown
                        className={`ml-1 h-4 w-4 ${
                          sortConfig.key === "incidentDateTime" ? "text-blue-500" : "text-gray-400"
                        } ${
                          sortConfig.key === "incidentDateTime" && sortConfig.direction === "asc"
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center">
                      <Flag className="mr-1 h-4 w-4 text-gray-400" />
                      Status
                      <ChevronDown
                        className={`ml-1 h-4 w-4 ${
                          sortConfig.key === "status" ? "text-blue-500" : "text-gray-400"
                        } ${
                          sortConfig.key === "status" && sortConfig.direction === "asc"
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCases.length > 0 ? (
                  filteredCases.map((fir) => {
                    const investigator = fir.assignedInvestigator ? investigators[fir.assignedInvestigator] : null;
                    return (
                      <tr key={fir.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {fir.complainantName}
                          </div>
                          <div className="text-sm text-gray-500">{fir.contactNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{fir.incidentType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {investigator ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {investigator.realName}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{investigator.username}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Not Assigned</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {fir.incidentLocation?.city || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {fir.incidentDateTime
                              ? new Date(fir.incidentDateTime).toLocaleString()
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              fir.status === "Open"
                                ? "bg-green-100 text-green-800"
                                : fir.status === "Closed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {fir.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                          <button
                            onClick={() => openModal(fir)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(fir.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            disabled={deletingId === fir.id}
                          >
                            {deletingId === fir.id ? (
                              <TailSpin color="#EF4444" height={16} width={16} />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No cases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for FIR Details */}
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
              <h3 className="text-xl font-semibold mb-4">Investigator Details</h3>
              {selectedFIR.assignedInvestigator ? (
                <>
                  <p>
                    <strong>Name:</strong> {investigators[selectedFIR.assignedInvestigator]?.realName || "Unknown"}
                  </p>
                  <p>
                    <strong>Username:</strong> @{investigators[selectedFIR.assignedInvestigator]?.username || "N/A"}
                  </p>
                </>
              ) : (
                <p>No investigator assigned</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Location Details</h3>
              <p>
                <strong>Address:</strong> {selectedFIR.incidentLocation?.address || "N/A"}
              </p>
              <p>
                <strong>City:</strong> {selectedFIR.incidentLocation?.city || "N/A"}
              </p>
              <p>
                <strong>State:</strong> {selectedFIR.incidentLocation?.state || "N/A"}
              </p>
              <p>
                <strong>GPS Coordinates:</strong>{" "}
                {selectedFIR.incidentLocation?.gpsCoordinates || "N/A"}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Suspect Information</h3>
              <p>
                <strong>Name:</strong> {selectedFIR.suspectDetails?.name || "N/A"}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedFIR.suspectDetails?.description || "N/A"}
              </p>
              <p>
                <strong>Known Address:</strong>{" "}
                {selectedFIR.suspectDetails?.knownAddress || "N/A"}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Witness Information</h3>
              <p>
                <strong>Name:</strong> {selectedFIR.witnessDetails?.name || "N/A"}
              </p>
              <p>
                <strong>Contact:</strong> {selectedFIR.witnessDetails?.contact || "N/A"}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Supporting Documents</h3>
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

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this case?")) {
                    handleDelete(selectedFIR.id);
                    closeModal();
                  }
                }}
                className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 flex items-center"
                disabled={deletingId === selectedFIR.id}
              >
                {deletingId === selectedFIR.id ? (
                  <TailSpin color="#FFFFFF" height={20} width={20} />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Case
                  </>
                )}
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalCases;