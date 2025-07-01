import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { TailSpin } from 'react-loader-spinner';
import { Search, ChevronDown, Calendar, Trash2, Send, AlertCircle } from 'lucide-react';

const SolvedCases = () => {
  const [cases, setCases] = useState([]);
  const [investigators, setInvestigators] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Solved cases
        const casesQuery = query(
          collection(db, 'firs'),
          where('status', '==', 'Solved')
        );
        const casesSnapshot = await getDocs(casesQuery);
        
        const casesData = [];
        const investigatorIds = new Set();
        
        casesSnapshot.forEach((doc) => {
          const data = doc.data();
          casesData.push({ 
            id: doc.id, 
            ...data
          });
          
          if (data.assignedInvestigator) {
            investigatorIds.add(data.assignedInvestigator);
          }
        });

        // Fetch investigators data
        let investigatorsData = {};
        if (investigatorIds.size > 0) {
          const investigatorsQuery = query(
            collection(db, 'investigatordata'),
            where('__name__', 'in', Array.from(investigatorIds))
          );
          const investigatorsSnapshot = await getDocs(investigatorsQuery);
          
          investigatorsSnapshot.forEach((doc) => {
            investigatorsData[doc.id] = doc.data();
          });
        }

        setInvestigators(investigatorsData);
        setCases(casesData);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCases = React.useMemo(() => {
    let sortableItems = [...cases];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Handle nested properties
        const getValue = (obj, key) => {
          return key.split('.').reduce((o, k) => (o || {})[k], obj);
        };

        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [cases, sortConfig]);

  const filteredCases = React.useMemo(() => {
    return sortedCases.filter((fir) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (fir.complainantName?.toLowerCase().includes(searchLower)) ||
        (fir.incidentType?.toLowerCase().includes(searchLower)) ||
        (fir.incidentLocation?.city?.toLowerCase().includes(searchLower)) ||
        (fir.incidentDescription?.toLowerCase().includes(searchLower)) ||
        (fir.contactNumber?.includes(searchTerm))
      );
    });
  }, [sortedCases, searchTerm]);

  const openModal = (fir) => {
    setSelectedFIR(fir);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFIR(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        setDeletingId(id);
        await deleteDoc(doc(db, 'firs', id));
        setCases(cases.filter((fir) => fir.id !== id));
      } catch (error) {
        console.error('Error deleting document:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openMessageModal = (fir) => {
    setSelectedFIR(fir);
    setShowMessageModal(true);
    setMessageContent('');
    setMessageSent(false);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedFIR(null);
    setMessageContent('');
  };

  const sendMessageToInvestigator = async () => {
    if (!messageContent.trim() || !selectedFIR?.assignedInvestigator) return;
    
    try {
      setSendingMessage(true);
      
      await addDoc(collection(db, 'adminalerts'), {
        investigatorId: selectedFIR.assignedInvestigator,
        message: messageContent,
        createdAt: serverTimestamp(),
        read: false,
        caseId: selectedFIR.id,
        caseTitle: selectedFIR.incidentType || 'Solved Case'
      });
      
      setMessageSent(true);
      setTimeout(() => {
        setShowMessageModal(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <TailSpin color="#3B82F6" height={60} width={60} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Solved Cases</h1>
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Solved cases..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'} found
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('complainantName')}
                >
                  <div className="flex items-center">
                    Complainant
                    <ChevronDown
                      className={`ml-1 h-4 w-4 ${
                        sortConfig.key === 'complainantName' ? 'text-blue-500' : 'text-gray-300'
                      } ${
                        sortConfig.key === 'complainantName' && sortConfig.direction === 'asc'
                          ? 'transform rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('incidentType')}
                >
                  <div className="flex items-center">
                    Incident Type
                    <ChevronDown
                      className={`ml-1 h-4 w-4 ${
                        sortConfig.key === 'incidentType' ? 'text-blue-500' : 'text-gray-300'
                      } ${
                        sortConfig.key === 'incidentType' && sortConfig.direction === 'asc'
                          ? 'transform rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investigator
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('incidentLocation.city')}
                >
                  <div className="flex items-center">
                    Location
                    <ChevronDown
                      className={`ml-1 h-4 w-4 ${
                        sortConfig.key === 'incidentLocation.city' ? 'text-blue-500' : 'text-gray-300'
                      } ${
                        sortConfig.key === 'incidentLocation.city' && sortConfig.direction === 'asc'
                          ? 'transform rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('incidentDateTime')}
                >
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Date/Time
                    <ChevronDown
                      className={`ml-1 h-4 w-4 ${
                        sortConfig.key === 'incidentDateTime' ? 'text-blue-500' : 'text-gray-300'
                      } ${
                        sortConfig.key === 'incidentDateTime' && sortConfig.direction === 'asc'
                          ? 'transform rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <div className="font-medium text-gray-900">{fir.complainantName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{fir.contactNumber || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fir.incidentType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {investigator ? (
                          <div>
                            <div className="font-medium text-gray-900">{investigator.realName}</div>
                            <div className="text-sm text-gray-500">@{investigator.username}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fir.incidentLocation?.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fir.incidentDateTime ? 
                          new Date(fir.incidentDateTime).toLocaleString() : 
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Solved
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-3">
                        <button
                          onClick={() => openModal(fir)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {investigator && (
                          <button
                            onClick={() => openMessageModal(fir)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Message
                          </button>
                        )}
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
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      {cases.length === 0 ? (
                        <>
                          <p className="font-medium">No Solved cases found</p>
                          <p className="text-sm mt-1">All cases have been processed or none have been Solved yet.</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">No matching cases found</p>
                          <p className="text-sm mt-1">Try adjusting your search query.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Modal */}
      {showModal && selectedFIR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Case Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Complainant</h3>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.complainantName || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Contact</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.contactNumber || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.email || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Incident</h3>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentType || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Date/Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentDateTime ? 
                      new Date(selectedFIR.incidentDateTime).toLocaleString() : 
                      <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentDescription || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Location</h3>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentLocation?.address || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentLocation?.city || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">State</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentLocation?.state || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
                <div className="mb-2">
                  <dt className="text-sm font-medium text-gray-500">GPS Coordinates</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedFIR.incidentLocation?.gpsCoordinates || <span className="text-gray-400">Not provided</span>}
                  </dd>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Investigator</h3>
                {selectedFIR.assignedInvestigator ? (
                  <>
                    <div className="mb-2">
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {investigators[selectedFIR.assignedInvestigator]?.realName || 'Unknown'}
                      </dd>
                    </div>
                    <div className="mb-2">
                      <dt className="text-sm font-medium text-gray-500">Username</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        @{investigators[selectedFIR.assignedInvestigator]?.username || 'N/A'}
                      </dd>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        openMessageModal(selectedFIR);
                      }}
                      className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center text-sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send Message
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500">No investigator assigned</p>
                )}
              </div>
            </div>

            {selectedFIR.supportingDocuments?.length > 0 && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Documents</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFIR.supportingDocuments.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white border border-gray-200 rounded-md text-blue-600 hover:bg-blue-50"
                    >
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  handleDelete(selectedFIR.id);
                  closeModal();
                }}
                disabled={deletingId === selectedFIR.id}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 flex items-center"
              >
                {deletingId === selectedFIR.id ? (
                  <TailSpin color="#FFFFFF" height={20} width={20} />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Case
                  </>
                )}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message to Investigator Modal */}
      {showMessageModal && selectedFIR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                Send Message to Investigator
              </h2>
              <button
                onClick={closeMessageModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {selectedFIR.assignedInvestigator && investigators[selectedFIR.assignedInvestigator] && (
              <div className="mb-4 bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-700 mb-1">Sending to:</p>
                <p className="font-medium">
                  {investigators[selectedFIR.assignedInvestigator].realName} (@{investigators[selectedFIR.assignedInvestigator].username})
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Case: {selectedFIR.incidentType || 'Solved Case'} (ID: {selectedFIR.id.slice(0, 6)}...)
                </p>
              </div>
            )}

            {messageSent ? (
              <div className="p-4 bg-green-100 text-green-700 rounded-md text-center">
                Message sent successfully!
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your message here..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeMessageModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessageToInvestigator}
                    disabled={!messageContent.trim() || sendingMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                  >
                    {sendingMessage ? (
                      <TailSpin color="#FFFFFF" height={20} width={20} />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SolvedCases;