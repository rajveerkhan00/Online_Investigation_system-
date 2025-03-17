import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { db, storage, auth } from "../firebase"; // Import Firebase configurations
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Chatbot from "../components/Chatbot";

const FIRSubmission = () => {
  const [firs, setFirs] = useState([]);
  const [newFIR, setNewFIR] = useState({
    complainantName: "",
    contactNumber: "",
    email: "",
    incidentType: "",
    customIncidentType: "",
    incidentDateTime: "",
    incidentLocation: {
      address: "",
      city: "",
      state: "",
      gpsCoordinates: "",
    },
    suspectDetails: {
      name: "",
      description: "",
      knownAddress: "",
    },
    witnessDetails: {
      name: "",
      contact: "",
    },
    incidentDescription: "",
    supportingDocuments: [],
    status: "Pending",
    termsAgreed: false,
    userId: "", // Add userId to associate FIR with the user
    assignedInvestigator: "", // Add assignedInvestigator field
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [investigators, setInvestigators] = useState([]); // List of investigators
  const [selectedInvestigator, setSelectedInvestigator] = useState(null); // Selected investigator
  const [investigatorSpace, setInvestigatorSpace] = useState(null); // Space availability for the selected investigator

  // Fetch FIRs for the logged-in user
  useEffect(() => {
    const fetchFirs = async () => {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please log in to view your FIRs.");
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "firs"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const firData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFirs(firData);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to fetch FIRs");
        setLoading(false);
      }
    };

    fetchFirs();
  }, []);

  // Fetch all investigators from Firestore
  useEffect(() => {
    const fetchInvestigators = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "investigatordata"));
        const investigatorsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvestigators(investigatorsData);
      } catch (error) {
        toast.error("Failed to fetch investigators");
      }
    };

    fetchInvestigators();
  }, []);

  // Check if the selected investigator has space (less than 10 active/pending cases)
  const checkInvestigatorSpace = async (investigatorId) => {
    try {
      const q = query(
        collection(db, "firs"),
        where("assignedInvestigator", "==", investigatorId),
        where("status", "in", ["Pending", "Active"])
      );
      const querySnapshot = await getDocs(q);
      const caseCount = querySnapshot.size;

      if (caseCount < 10) {
        setInvestigatorSpace(true); // Green tick
      } else {
        setInvestigatorSpace(false); // Red cross
      }
    } catch (error) {
      toast.error("Failed to check investigator space");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewFIR((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setNewFIR((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle file upload to Firebase Storage
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const storageRef = ref(storage, `documents/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      }
      setNewFIR((prev) => ({
        ...prev,
        supportingDocuments: [...prev.supportingDocuments, ...uploadedUrls],
      }));
      toast.success("Files uploaded successfully!");
    } catch (error) {
      toast.error("File upload failed");
    }
  };

  // Submit FIR to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const user = auth.currentUser;
    if (!user) {
      toast.error("Please log in to submit an FIR.");
      return;
    }

    // Check if an investigator is selected and has space
    if (!selectedInvestigator || !investigatorSpace) {
      toast.error("Please select an investigator with available space.");
      return;
    }

    try {
      const firData = {
        ...newFIR,
        incidentType:
          newFIR.incidentType === "Other"
            ? newFIR.customIncidentType
            : newFIR.incidentType,
        timestamp: new Date().toISOString(),
        userId: user.uid, // Associate FIR with the user's UID
        assignedInvestigator: selectedInvestigator, // Assign the selected investigator
      };

      // Add FIR to Firestore
      const docRef = await addDoc(collection(db, "firs"), firData);
      setFirs((prev) => [...prev, { id: docRef.id, ...firData }]);
      toast.success("FIR submitted successfully!");
      resetForm();
    } catch (error) {
      toast.error(error.message || "FIR submission failed");
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "complainantName",
      "contactNumber",
      "incidentType",
      "incidentDateTime",
      "incidentDescription",
    ];

    const missingFields = requiredFields.filter((field) => !newFIR[field]);
    if (missingFields.length > 0) {
      toast.error("Please fill all required fields");
      return false;
    }

    if (!/^\d{10}$/.test(newFIR.contactNumber)) {
      toast.error("Invalid contact number");
      return false;
    }

    if (!newFIR.termsAgreed) {
      toast.error("You must agree to the terms and conditions");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setNewFIR({
      complainantName: "",
      contactNumber: "",
      email: "",
      incidentType: "",
      customIncidentType: "",
      incidentDateTime: "",
      incidentLocation: {
        address: "",
        city: "",
        state: "",
        gpsCoordinates: "",
      },
      suspectDetails: {
        name: "",
        description: "",
        knownAddress: "",
      },
      witnessDetails: {
        name: "",
        contact: "",
      },
      incidentDescription: "",
      supportingDocuments: [],
      status: "Pending",
      termsAgreed: false,
      userId: "", // Reset userId
      assignedInvestigator: "", // Reset assignedInvestigator
    });
    setShowForm(false);
    setSelectedInvestigator(null);
    setInvestigatorSpace(null);
    toast.info("Form reset successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navbar />
      <Chatbot />
      
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
        theme="colored"
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-left mb-10 mt-10">
          Online FIR Submission System
        </h1>

        {!showForm ? (
          <div className="text-left mb-20">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 mt-10 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              File New FIR +
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6">FIR Details</h2>

            {/* Complainant Information */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Complainant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="complainantName"
                  value={newFIR.complainantName}
                  onChange={handleChange}
                  placeholder="Full Name *"
                  className="p-2 border rounded"
                  required
                />
                <input
                  name="contactNumber"
                  value={newFIR.contactNumber}
                  onChange={handleChange}
                  placeholder="Contact Number *"
                  className="p-2 border rounded"
                  pattern="\d{10}"
                  required
                />
                <input
                  name="email"
                  type="email"
                  value={newFIR.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="p-2 border rounded"
                />
              </div>
            </div>

            {/* Incident Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Incident Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="incidentType"
                  value={newFIR.incidentType}
                  onChange={handleChange}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">Select Incident Type *</option>
                  <option value="Theft">Theft</option>
                  <option value="Assault">Assault</option>
                  <option value="Burglary">Burglary</option>
                  <option value="Fraud">Fraud</option>
                  <option value="Cyber Crime">Cyber Crime</option>
                  <option value="Other">Other</option>
                </select>

                {newFIR.incidentType === "Other" && (
                  <input
                    name="customIncidentType"
                    value={newFIR.customIncidentType}
                    onChange={handleChange}
                    placeholder="Specify Incident Type *"
                    className="p-2 border rounded"
                    required
                  />
                )}

                <input
                  type="datetime-local"
                  name="incidentDateTime"
                  value={newFIR.incidentDateTime}
                  onChange={handleChange}
                  className="p-2 border rounded"
                  required
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="incidentLocation.address"
                  value={newFIR.incidentLocation.address}
                  onChange={handleChange}
                  placeholder="Address *"
                  className="p-2 border rounded"
                  required
                />
                <input
                  name="incidentLocation.city"
                  value={newFIR.incidentLocation.city}
                  onChange={handleChange}
                  placeholder="City *"
                  className="p-2 border rounded"
                  required
                />
                <input
                  name="incidentLocation.state"
                  value={newFIR.incidentLocation.state}
                  onChange={handleChange}
                  placeholder="State *"
                  className="p-2 border rounded"
                  required
                />
                <input
                  name="incidentLocation.gpsCoordinates"
                  value={newFIR.incidentLocation.gpsCoordinates}
                  onChange={handleChange}
                  placeholder="GPS Coordinates (optional)"
                  className="p-2 border rounded"
                />
              </div>
            </div>

            {/* Suspect Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Suspect Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="suspectDetails.name"
                  value={newFIR.suspectDetails.name}
                  onChange={handleChange}
                  placeholder="Suspect Name (if known)"
                  className="p-2 border rounded"
                />
                <input
                  name="suspectDetails.knownAddress"
                  value={newFIR.suspectDetails.knownAddress}
                  onChange={handleChange}
                  placeholder="Known Address"
                  className="p-2 border rounded"
                />
                <textarea
                  name="suspectDetails.description"
                  value={newFIR.suspectDetails.description}
                  onChange={handleChange}
                  placeholder="Physical Description"
                  className="p-2 border rounded col-span-2"
                  rows="3"
                />
              </div>
            </div>

            {/* Witness Details */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="witnessDetails.name"
                  value={newFIR.witnessDetails.name}
                  onChange={handleChange}
                  placeholder="Witness Name (if any)"
                  className="p-2 border rounded"
                />
                <input
                  name="witnessDetails.contact"
                  value={newFIR.witnessDetails.contact}
                  onChange={handleChange}
                  placeholder="Witness Contact Information"
                  className="p-2 border rounded"
                />
              </div>
            </div>

            {/* Incident Description */}
            <div className="mb-6">
              <textarea
                name="incidentDescription"
                value={newFIR.incidentDescription}
                onChange={handleChange}
                placeholder="Detailed Description of Incident *"
                className="w-full p-2 border rounded"
                rows="5"
                required
              />
            </div>

            {/* Document Upload */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold">
                Supporting Documents (Photos, Videos, Documents)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="w-full p-2 border rounded"
                accept=".pdf,.jpg,.jpeg,.png,.mp4"
              />
              <div className="mt-2">
                {newFIR.supportingDocuments.map((url, index) => (
                  <div key={index} className="text-blue-600 truncate">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Document {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigator Selection */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold">
                Select Investigator
              </label>
              <div className="flex items-center gap-4">
                <select
                  value={selectedInvestigator || ""}
                  onChange={(e) => {
                    setSelectedInvestigator(e.target.value);
                    setInvestigatorSpace(null); // Reset space check
                  }}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">Select Investigator *</option>
                  {investigators.map((investigator) => (
                    <option key={investigator.id} value={investigator.id}>
                      {investigator.username}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => checkInvestigatorSpace(selectedInvestigator)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  See Space
                </button>
                {investigatorSpace !== null && (
                  <span className="text-2xl">
                    {investigatorSpace ? "✅" : "❌"}
                  </span>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="termsAgreed"
                  checked={newFIR.termsAgreed}
                  onChange={(e) =>
                    setNewFIR((prev) => ({
                      ...prev,
                      termsAgreed: e.target.checked,
                    }))
                  }
                  className="mr-2"
                  required
                />
                <span>
                  I hereby declare that the information provided is true to the best of my
                  knowledge. I understand that false reporting may lead to legal
                  consequences under Section 177 IPC.
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Submit FIR
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FIRSubmission;