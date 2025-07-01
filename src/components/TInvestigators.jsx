import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where, deleteDoc, doc, addDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TInvestigators = () => {
  const [investigators, setInvestigators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestigator, setSelectedInvestigator] = useState(null);
  const [message, setMessage] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Fetch only approved investigators from Firestore
  useEffect(() => {
    const fetchInvestigators = async () => {
      try {
        // Query only approved investigators
        const q = query(
          collection(db, "investigatordata"),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);
        
        const investigatorsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          realName: doc.data().realName || "N/A",
          username: doc.data().username || "N/A",
          email: doc.data().email || "N/A",
          phoneNumber: doc.data().phoneNumber || "N/A",
          badgeNumber: doc.data().badgeNumber || "N/A",
          stars: doc.data().stars || "N/A",
          policeStation: doc.data().policeStation || "N/A"
        }));
        
        setInvestigators(investigatorsData);
      } catch (error) {
        toast.error("Failed to fetch investigators: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestigators();
  }, []);

  // Delete an investigator
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "investigatordata", id));
      setInvestigators(investigators.filter((inv) => inv.id !== id));
      toast.success("Investigator deleted successfully");
    } catch (error) {
      toast.error("Failed to delete investigator: " + error.message);
    }
  };

  // Send message to investigator
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      await addDoc(collection(db, "Adminalerts"), {
        investigatorId: selectedInvestigator.id,
        investigatorName: selectedInvestigator.realName,
        message: message,
        timestamp: new Date(),
        status: "unread",
      });

      toast.success("Message sent successfully");
      setMessage("");
      setShowMessageModal(false);
    } catch (error) {
      toast.error("Failed to send message: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center sm:text-left">
    Approved Investigators
  </h1>

  {investigators.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-gray-500 text-base sm:text-lg">No approved investigators found</p>
    </div>
  ) : (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full bg-white text-sm sm:text-base">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-3 px-4 text-left whitespace-nowrap">Real Name</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Username</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Email</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Phone</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Badge #</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Stars</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Station</th>
            <th className="py-3 px-4 text-left whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {investigators.map((investigator) => (
            <tr key={investigator.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4">{investigator.realName}</td>
              <td className="py-3 px-4">{investigator.username}</td>
              <td className="py-3 px-4">{investigator.email}</td>
              <td className="py-3 px-4">{investigator.phoneNumber}</td>
              <td className="py-3 px-4">{investigator.badgeNumber}</td>
              <td className="py-3 px-4">{investigator.stars}</td>
              <td className="py-3 px-4">{investigator.policeStation}</td>
              <td className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                  <button
                    onClick={() => {
                      setSelectedInvestigator(investigator);
                      setShowMessageModal(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs sm:text-sm"
                  >
                    Message
                  </button>
                  <button
                    onClick={() => handleDelete(investigator.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  {/* Message Modal */}
  {showMessageModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Send Message to {selectedInvestigator?.realName}
          </h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowMessageModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
  />
</div>

  );
};

export default TInvestigators;