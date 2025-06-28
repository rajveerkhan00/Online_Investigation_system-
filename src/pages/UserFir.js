import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import Chatbot from "../components/Chatbot";
import { AdvancedImage } from "@cloudinary/react";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

// Initialize Cloudinary
const cld = new Cloudinary({ cloud: { cloudName: "dtv5vzkms" } });

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
    idCardFront: "",
    status: "Pending",
    termsAgreed: false,
    userId: "",
    assignedInvestigator: "",
    idVerified: false,
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [investigators, setInvestigators] = useState([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState(null);
  const [investigatorSpace, setInvestigatorSpace] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [idCardUploaded, setIdCardUploaded] = useState(false);

  // Verify ID card using Tesseract.js backend
  const verifyIdCard = async (imageUrl) => {
    try {
      setVerifying(true);
      toast.info("Verifying ID card...");

      // Convert Cloudinary URL to blob for upload
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('idCardImage', blob, 'id-card.jpg');

      const apiResponse = await fetch('http://localhost:5000/api/verify-id', {
        method: 'POST',
        body: formData,
      });

      const result = await apiResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      if (result.verified) {
        toast.success("Pakistani ID card verified successfully!");
        return true;
      } else {
        toast.error(result.message || "Image unclear or not a Pakistani ID card. Please upload a proper ID card picture.");
        return false;
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify ID card. Please try again.");
      return false;
    } finally {
      setVerifying(false);
    }
  };

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

  // Check if the selected investigator has space
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
        setInvestigatorSpace(true);
        toast.success("Investigator has available space");
      } else {
        setInvestigatorSpace(false);
        toast.error("Investigator is at full capacity");
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

  // Handle image upload to Cloudinary
  const handleImageUpload = async (file) => {
    if (!file) {
      toast.error("No file selected.");
      return "";
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and GIF are allowed.");
      return "";
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large. Maximum size is 5MB.");
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "my_preset");

    try {
      setUploading(true);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dtv5vzkms/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image: " + response.statusText);
      }

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("No URL returned from Cloudinary.");
      }
    } catch (error) {
      toast.error("Failed to upload image: " + error.message);
      return "";
    } finally {
      setUploading(false);
    }
  };

  // Handle ID card upload with verification
  const handleIdCardUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await handleImageUpload(file);
    if (!url) return;

    setNewFIR(prev => ({
      ...prev,
      idCardFront: url,
    }));
    
    setIdCardUploaded(true);
    toast.success("Front ID uploaded successfully!");

    // Verify the ID card
    const isVerified = await verifyIdCard(url);
    setNewFIR(prev => ({ ...prev, idVerified: isVerified }));
    
    if (isVerified) {
      toast.success("Pakistani ID card verified successfully!");
    } else {
      toast.warning("Could not verify as a valid Pakistani ID card. Please ensure the image is clear.");
    }
  };

  // Handle supporting documents upload
  const handleSupportingDocsUpload = async (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 3 - newFIR.supportingDocuments.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast.info(`You can only upload ${remainingSlots} more file(s)`);
      return;
    }

    const uploadedUrls = [];
    for (const file of filesToUpload) {
      const url = await handleImageUpload(file);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      setNewFIR((prev) => ({
        ...prev,
        supportingDocuments: [...prev.supportingDocuments, ...uploadedUrls],
      }));
      toast.success(`${uploadedUrls.length} file(s) uploaded successfully!`);
    }
  };

  // Remove a supporting document
  const removeSupportingDoc = (index) => {
    setNewFIR((prev) => {
      const updatedDocs = [...prev.supportingDocuments];
      updatedDocs.splice(index, 1);
      return { ...prev, supportingDocuments: updatedDocs };
    });
    toast.info("Document removed");
  };

  // Form validation
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
      toast.error("Invalid contact number (must be 10 digits)");
      return false;
    }

    if (newFIR.email && !/^\S+@\S+\.\S+$/.test(newFIR.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!newFIR.termsAgreed) {
      toast.error("You must agree to the terms and conditions");
      return false;
    }

    if (!newFIR.idCardFront) {
      toast.error("Please upload the front of your ID card");
      return false;
    }

    if (!newFIR.idVerified) {
      toast.error("Please verify your ID card before submission");
      return false;
    }

    if (!selectedInvestigator || !investigatorSpace) {
      toast.error("Please select an available investigator");
      return false;
    }

    return true;
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

    try {
      const firData = {
        ...newFIR,
        incidentType:
          newFIR.incidentType === "Other"
            ? newFIR.customIncidentType
            : newFIR.incidentType,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        assignedInvestigator: selectedInvestigator,
      };

      const docRef = await addDoc(collection(db, "firs"), firData);
      setFirs((prev) => [...prev, { id: docRef.id, ...firData }]);
      toast.success("FIR submitted successfully!");
      resetForm();
    } catch (error) {
      toast.error(error.message || "FIR submission failed");
    }
  };

  // Reset form to initial state
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
      idCardFront: "",
      status: "Pending",
      termsAgreed: false,
      userId: "",
      assignedInvestigator: "",
      idVerified: false,
    });
    setIdCardUploaded(false);
    setShowForm(false);
    setSelectedInvestigator(null);
    setInvestigatorSpace(null);
  };

  // Helper function to extract public ID from Cloudinary URL
  const extractPublicId = (url) => {
    const parts = url.split("/upload/");
    if (parts.length > 1) {
      return parts[1].split(".")[0];
    }
    return url;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navbar />
      <Chatbot />
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
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

            {!loading && firs.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Your Previous FIRs</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border">FIR ID</th>
                        <th className="py-2 px-4 border">Incident Type</th>
                        <th className="py-2 px-4 border">Date/Time</th>
                        <th className="py-2 px-4 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firs.map((fir) => (
                        <tr key={fir.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border">{fir.id.substring(0, 8)}...</td>
                          <td className="py-2 px-4 border">{fir.incidentType}</td>
                          <td className="py-2 px-4 border">
                            {new Date(fir.incidentDateTime).toLocaleString()}
                          </td>
                          <td className="py-2 px-4 border">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              fir.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                              fir.status === "Active" ? "bg-blue-100 text-blue-800" :
                              "bg-green-100 text-green-800"
                            }`}>
                              {fir.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                <div>
                  <input
                    name="complainantName"
                    value={newFIR.complainantName}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <input
                    name="contactNumber"
                    value={newFIR.contactNumber}
                    onChange={handleChange}
                    placeholder="Contact Number *"
                    className="w-full p-2 border rounded"
                    pattern="\d{10}"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    name="email"
                    type="email"
                    value={newFIR.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* ID Card Upload and Verification */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">ID Card Verification (Required)</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-2">Front Side of ID Card *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdCardUpload}
                    className="w-full p-2 border rounded"
                    required
                    disabled={uploading || verifying}
                  />
                  {newFIR.idCardFront && (
                    <div className="mt-2">
                      <AdvancedImage
                        cldImg={cld.image(extractPublicId(newFIR.idCardFront)).resize(auto().gravity(autoGravity()).width(300).height(200))}
                        className="h-32 object-contain border rounded mx-auto"
                      />
                    </div>
                  )}
                  {!idCardUploaded && (
                    <p className="text-red-500 text-sm mt-1">Front ID card is required</p>
                  )}
                </div>
              </div>
              {newFIR.idVerified ? (
                <p className="text-green-600 mt-2">✓ Pakistani ID successfully verified</p>
              ) : idCardUploaded ? (
                verifying ? (
                  <p className="text-blue-600 mt-2">Verifying ID, please wait...</p>
                ) : (
                  <p className="text-yellow-600 mt-2">
                    ID verification required. Please click "Submit FIR" to complete verification.
                  </p>
                )
              ) : (
                <p className="text-gray-600 mt-2">
                  Please upload the front of your Pakistani ID card
                </p>
              )}
            </div>

            {/* Incident Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Incident Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    name="incidentType"
                    value={newFIR.incidentType}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
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
                </div>
                <div>
                  {newFIR.incidentType === "Other" && (
                    <input
                      name="customIncidentType"
                      value={newFIR.customIncidentType}
                      onChange={handleChange}
                      placeholder="Specify Incident Type *"
                      className="w-full p-2 border rounded"
                      required
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <input
                    type="datetime-local"
                    name="incidentDateTime"
                    value={newFIR.incidentDateTime}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    name="incidentLocation.address"
                    value={newFIR.incidentLocation.address}
                    onChange={handleChange}
                    placeholder="Address *"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <input
                    name="incidentLocation.city"
                    value={newFIR.incidentLocation.city}
                    onChange={handleChange}
                    placeholder="City *"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <input
                    name="incidentLocation.state"
                    value={newFIR.incidentLocation.state}
                    onChange={handleChange}
                    placeholder="State *"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <input
                    name="incidentLocation.gpsCoordinates"
                    value={newFIR.incidentLocation.gpsCoordinates}
                    onChange={handleChange}
                    placeholder="GPS Coordinates (optional)"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Suspect Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Suspect Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    name="suspectDetails.name"
                    value={newFIR.suspectDetails.name}
                    onChange={handleChange}
                    placeholder="Suspect Name (if known)"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <input
                    name="suspectDetails.knownAddress"
                    value={newFIR.suspectDetails.knownAddress}
                    onChange={handleChange}
                    placeholder="Known Address"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <textarea
                    name="suspectDetails.description"
                    value={newFIR.suspectDetails.description}
                    onChange={handleChange}
                    placeholder="Physical Description"
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Witness Details */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Witness Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    name="witnessDetails.name"
                    value={newFIR.witnessDetails.name}
                    onChange={handleChange}
                    placeholder="Witness Name (if any)"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <input
                    name="witnessDetails.contact"
                    value={newFIR.witnessDetails.contact}
                    onChange={handleChange}
                    placeholder="Witness Contact Information"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Incident Description */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Incident Description *</h3>
              <textarea
                name="incidentDescription"
                value={newFIR.incidentDescription}
                onChange={handleChange}
                placeholder="Provide detailed description of what happened *"
                className="w-full p-2 border rounded"
                rows="5"
                required
              />
            </div>

            {/* Supporting Documents Upload */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Supporting Evidence (Optional)</h3>
              <div className="border rounded p-4 bg-gray-50">
                <label className="block mb-2 font-medium">
                  Upload Supporting Documents (Max 3 files)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleSupportingDocsUpload}
                  className="w-full p-2 border rounded"
                  accept=".jpg,.jpeg,.png"
                  disabled={newFIR.supportingDocuments.length >= 3 || uploading}
                />
                {uploading && <p className="text-blue-600 mt-2">Uploading files, please wait...</p>}
                <p className="text-sm text-gray-500 mt-2">
                  {3 - newFIR.supportingDocuments.length} out of 3 slots remaining
                </p>
                
                {newFIR.supportingDocuments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {newFIR.supportingDocuments.map((url, index) => (
                        <div key={index} className="border rounded p-3 bg-white">
                          <AdvancedImage
                            cldImg={cld.image(extractPublicId(url)).resize(auto().gravity(autoGravity()).width(200).height(200))}
                            className="h-32 object-contain mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => removeSupportingDoc(index)}
                            className="text-red-500 hover:text-red-700 text-sm mt-2 block mx-auto"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Investigator Selection */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Investigator Assignment</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <select
                  value={selectedInvestigator || ""}
                  onChange={(e) => {
                    setSelectedInvestigator(e.target.value);
                    setInvestigatorSpace(null);
                  }}
                  className="flex-grow p-2 border rounded"
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
                  disabled={!selectedInvestigator || uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  Check Availability
                </button>
                {investigatorSpace !== null && (
                  <span className={`text-lg font-medium ${investigatorSpace ? 'text-green-600' : 'text-red-600'}`}>
                    {investigatorSpace ? "Available" : "Full"}
                  </span>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <label className="flex items-start">
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
                  className="mt-1 mr-2"
                  required
                />
                <span>
                  I hereby declare that the information provided is true to the best of my
                  knowledge. I understand that false reporting may lead to legal
                  consequences under Section 177 IPC.
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex-1"
                disabled={uploading || verifying || !newFIR.idVerified}
              >
                {uploading ? "Uploading..." : verifying ? "Verifying..." : "Submit FIR"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 flex-1"
                disabled={uploading || verifying}
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