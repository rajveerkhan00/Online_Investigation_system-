import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveAs } from 'file-saver';

const TotalUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users, their FIR data, and verifications
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Get all users
        const usersQuery = query(collection(db, "usersdata"));
        const usersSnapshot = await getDocs(usersQuery);
        
        // Get all FIRs
        const firsQuery = query(collection(db, "firs"));
        const firsSnapshot = await getDocs(firsQuery);
        const allFirs = firsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get all verifications (ID cards)
        const verificationsQuery = query(collection(db, "verifications"));
        const verificationsSnapshot = await getDocs(verificationsQuery);
        const allVerifications = verificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVerifications(allVerifications);

        // Process each user with their FIRs and ID card
        const usersData = await Promise.all(
          usersSnapshot.docs.map(async (userDoc) => {
            const user = userDoc.data();
            const userId = userDoc.id;

            // Filter FIRs for this user
            const userFirs = allFirs.filter(fir => fir.userId === userId);
            
            // Get reports (if needed from another collection)
            let userReports = [];
            try {
              const reportsQuery = query(
                collection(db, "reports"),
                where("userId", "==", userId)
              );
              const reportsSnapshot = await getDocs(reportsQuery);
              userReports = reportsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            } catch (error) {
              console.error("Error fetching reports:", error);
            }

            // Find verification (ID card) for this user
            const userVerification = allVerifications.find(v => v.userId === userId);
            const idCardUrl = userVerification?.idCardImageUrl || null;

            return {
              uid: userId,
              username: user.username || "N/A",
              email: user.email || "N/A",
              phone: user.phone || "N/A",
              createdAt: user.createdAt 
                ? new Date(user.createdAt).toLocaleDateString() 
                : "N/A",
              firsCount: userFirs.length,
              firs: userFirs,
              reports: userReports,
              idCardUrl,
              verificationStatus: userVerification?.status || "Not Verified"
            };
          })
        );

        setUsers(usersData);
      } catch (error) {
        toast.error("Failed to fetch data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete a user and their associated data
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user and all their data?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete user's FIRs first
      const userFirsQuery = query(
        collection(db, "firs"),
        where("userId", "==", userId)
      );
      const userFirsSnapshot = await getDocs(userFirsQuery);
      
      const deleteFirPromises = userFirsSnapshot.docs.map(firDoc => 
        deleteDoc(doc(db, "firs", firDoc.id))
      );
      
      // Delete user's reports
      const userReportsQuery = query(
        collection(db, "reports"),
        where("userId", "==", userId)
      );
      const userReportsSnapshot = await getDocs(userReportsQuery);
      
      const deleteReportPromises = userReportsSnapshot.docs.map(reportDoc => 
        deleteDoc(doc(db, "reports", reportDoc.id))
      );
      
      // Delete user's verification if exists
      const userVerification = verifications.find(v => v.userId === userId);
      if (userVerification) {
        await deleteDoc(doc(db, "verifications", userVerification.id));
      }
      
      // Then delete the user
      await deleteDoc(doc(db, "usersdata", userId));
      
      // Update state
      setUsers(prevUsers => prevUsers.filter(user => user.uid !== userId));
      setVerifications(prev => prev.filter(v => v.userId !== userId));
      toast.success("User and all associated data deleted successfully");
    } catch (error) {
      toast.error("Failed to delete: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // View ID card image
  const handleViewIdCard = (url) => {
    if (!url) {
      toast.warning("No ID card available for this user");
      return;
    }
    setImageUrl(url);
    setShowImageModal(true);
  };

  // Download ID card image
  const handleDownloadIdCard = async (url, username) => {
    if (!url) {
      toast.warning("No ID card to download");
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, `${username}_id_card_${Date.now()}.jpg`);
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed: " + error.message);
    }
  };

  // View user FIRs
  const handleViewFirs = (firs, user) => {
    setReports(firs);
    setSelectedUser(user);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center sm:text-left">
        User Management
      </h1>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name, email or phone..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base sm:text-lg">
            {searchTerm ? "No matching users found" : "No users found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm sm:text-base">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Username</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Email</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Phone</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Created</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">FIRs</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Verification</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">ID Card</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.username}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.email}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.phone}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.createdAt}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <button
                      onClick={() => handleViewFirs(user.firs, user)}
                      className={`text-blue-500 hover:underline ${user.firsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={user.firsCount === 0}
                    >
                      {user.firsCount} FIR{user.firsCount !== 1 ? 's' : ''}
                    </button>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800' :
                      user.verificationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {user.idCardUrl ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewIdCard(user.idCardUrl)}
                          className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadIdCard(user.idCardUrl, user.username)}
                          className="text-green-500 hover:text-green-700 text-xs sm:text-sm"
                        >
                          Download
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">None</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <button
                      onClick={() => handleDelete(user.uid)}
                      className="px-2 py-1 sm:px-3 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs sm:text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ID Card Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl">
            <div className="flex justify-between items-center border-b p-3 sm:p-4">
              <h2 className="text-lg sm:text-xl font-semibold">ID Card</h2>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 sm:p-6 flex justify-center">
              <img
                src={imageUrl}
                alt="User ID Card"
                className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                }}
              />
            </div>
            <div className="flex justify-end p-3 sm:p-4 border-t">
              <button
                onClick={() => {
                  const username = users.find(u => u.idCardUrl === imageUrl)?.username || 'id_card';
                  handleDownloadIdCard(imageUrl, username);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIRs Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl sm:max-w-4xl max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-3 sm:p-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">
                FIRs by {selectedUser.username}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No FIRs found for this user</p>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {reports.map((fir) => (
                    <div key={fir.id} className="border-b border-gray-100 pb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div>
                          <h3 className="font-medium text-sm sm:text-base">FIR ID: {fir.id}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Created: {fir.timestamp ? new Date(fir.timestamp).toLocaleString() : 'Unknown date'}
                          </p>
                        </div>
                        <span className={`mt-2 sm:mt-0 px-2 py-1 rounded text-xs ${
                          fir.status === 'Solved' ? 'bg-green-100 text-green-800' :
                          fir.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {fir.status || 'Unknown status'}
                        </span>
                      </div>
                      <div className="mt-2">
                        {fir.incidentDescription && (
                          <p className="text-gray-600 text-xs sm:text-sm">
                            <span className="font-semibold">Description:</span> {fir.incidentDescription}
                          </p>
                        )}
                        {fir.location && (
                          <p className="text-gray-600 text-xs sm:text-sm mt-1">
                            <span className="font-semibold">Location:</span> {fir.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default TotalUsers;