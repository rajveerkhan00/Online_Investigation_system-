import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBell, FaTimes } from 'react-icons/fa';

const AdminNotificationBell = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const q = query(collection(db, "approvals"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const requestsData = [];
          querySnapshot.forEach((doc) => {
            requestsData.push({ id: doc.id, ...doc.data() });
          });
          setRequests(requestsData);
          setNotificationCount(requestsData.length);
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load requests");
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      await updateDoc(doc(db, "approvals", requestId), {
        status: "approved",
        approvedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      await updateDoc(doc(db, "investigatordata", requestId), {
        status: "approved",
        approved: true,
        lastUpdated: new Date().toISOString()
      });

      toast.success("Investigator approved successfully!");
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve investigator");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await updateDoc(doc(db, "approvals", requestId), {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      await updateDoc(doc(db, "investigatordata", requestId), {
        status: "rejected",
        approved: false,
        lastUpdated: new Date().toISOString()
      });

      toast.success("Investigator rejected successfully!");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject investigator");
    }
  };

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (

<div className="relative z-50">
  <ToastContainer position="top-right" autoClose={3000} />

  {/* Bell Icon with Notification */}
  <div className="fixed top-[135px] right-12">
    <button
      onClick={togglePanel}
      className="p-3 bg-white rounded-full shadow-md border border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition duration-300 ease-in-out relative"
    >
      <FaBell size={20} />
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
          {notificationCount}
        </span>
      )}
    </button>

    {/* Dropdown Panel under Bell Icon */}
    {showPanel && (
      <div className="absolute top-14 right-0 w-[340px] sm:w-[400px] bg-white border border-gray-200 rounded-xl shadow-xl p-4">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Investigator Approvals ({notificationCount})
          </h2>
          <button onClick={togglePanel} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-2">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{request.realName}</h3>
                    <p className="text-xs text-gray-500">{request.email}</p>
                  </div>
                  <div className="text-right">
                    <p>
                      <span className="font-semibold">Badge:</span> {request.badgeNumber}
                    </p>
                    <p>
                      <span className="font-semibold">Station:</span>{" "}
                      {request.policeStation}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">
                    {new Date(request.requestedAt).toLocaleString()}
                  </span>
                  <div className="space-x-1">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</div>


  );
};

export default AdminNotificationBell;