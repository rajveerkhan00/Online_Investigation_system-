import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { TailSpin } from 'react-loader-spinner';
import { Search, ChevronDown, Calendar, Trash2, Send, AlertCircle } from 'lucide-react';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";


const UnSolvedCases = () => {
  const [cases, setCases] = useState([]);
  const [investigators, setInvestigators] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedInvestigatorId, setSelectedInvestigatorId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch UnSolved cases
        const casesQuery = query(
          collection(db, 'firs'),
          where('status', '==', 'UnSolved')
        );
        const casesSnapshot = await getDocs(casesQuery);
        
        const casesData = [];
        const investigatorIds = new Set();
        
        casesSnapshot.forEach((doc) => {
          const data = doc.data();
          casesData.push({ 
            id: doc.id, 
            ...data,
            unsolvedReason: data.unsolvedReason || 'No reason provided' // Add unsolvedReason field
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
        (fir.contactNumber?.includes(searchTerm)) ||
        (fir.unsolvedReason?.toLowerCase().includes(searchLower)) // Include unsolvedReason in search
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

  const openMessageModal = (investigatorId) => {
    setSelectedInvestigatorId(investigatorId);
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedInvestigatorId(null);
    setMessage('');
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedInvestigatorId) return;
    
    try {
      setSendingMessage(true);
      await addDoc(collection(db, 'adminalerts'), {
        investigatorId: selectedInvestigatorId,
        message: message.trim(),
        createdAt: serverTimestamp(),
        read: false
      });
      setMessage('');
      toast.success('Message sent successfully!');
      closeMessageModal();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
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
  <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
    <h1 className="text-2xl font-bold text-gray-800 mb-6">UnSolved Cases</h1>

    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="relative w-full sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search UnSolved cases..."
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
      <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('complainantName')}>
              <div className="flex items-center">
                Complainant
                <ChevronDown className={`ml-1 h-4 w-4 ${sortConfig.key === 'complainantName' ? 'text-blue-500' : 'text-gray-300'} ${sortConfig.key === 'complainantName' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
              </div>
            </th>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('incidentType')}>
              <div className="flex items-center">
                Incident Type
                <ChevronDown className={`ml-1 h-4 w-4 ${sortConfig.key === 'incidentType' ? 'text-blue-500' : 'text-gray-300'} ${sortConfig.key === 'incidentType' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
              </div>
            </th>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
              Investigator
            </th>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('incidentLocation.city')}>
              <div className="flex items-center">
                Location
                <ChevronDown className={`ml-1 h-4 w-4 ${sortConfig.key === 'incidentLocation.city' ? 'text-blue-500' : 'text-gray-300'} ${sortConfig.key === 'incidentLocation.city' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
              </div>
            </th>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort('incidentDateTime')}>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Date/Time
                <ChevronDown className={`ml-1 h-4 w-4 ${sortConfig.key === 'incidentDateTime' ? 'text-blue-500' : 'text-gray-300'} ${sortConfig.key === 'incidentDateTime' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
              </div>
            </th>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
              Unsolved Reason
            </th>
            <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
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
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{fir.complainantName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{fir.contactNumber || ''}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{fir.incidentType || 'N/A'}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {investigator ? (
                      <div>
                        <div className="font-medium text-gray-900">{investigator.realName}</div>
                        <div className="text-xs text-gray-500">@{investigator.username}</div>
                        <button
                          onClick={() => openMessageModal(fir.assignedInvestigator)}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Send className="h-3 w-3 mr-1" /> Message
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{fir.incidentLocation?.city || 'N/A'}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {fir.incidentDateTime ? new Date(fir.incidentDateTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{fir.unsolvedReason || 'No reason provided'}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium flex flex-col sm:flex-row gap-2 sm:space-x-3">
                    <button onClick={() => openModal(fir)} className="text-blue-600 hover:text-blue-900">
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
              <td colSpan="7" className="px-4 sm:px-6 py-8 text-center">
                <div className="text-gray-500">
                  {cases.length === 0 ? (
                    <>
                      <p className="font-medium">No UnSolved cases found</p>
                      <p className="text-sm mt-1">All cases have been processed or none have been UnSolved yet.</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto text-xs sm:text-sm">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Case Details</h2>
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-lg">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Keep your 3 modal detail sections unchanged here... */}
        </div>
      </div>
    </div>
  )}
</div>

  );
};

export default UnSolvedCases;