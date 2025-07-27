import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Headeri from "../components/Headeri";
import Footer from "../components/Footeri";
import InveNot from "../components/InveNot";
import * as faceapi from "face-api.js";

const AdminSearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [faceImage, setFaceImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load face-api.js models with enhanced error handling
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Starting model loading process...");
        
        // First try loading from local public/models directory
        const localModelUrl = process.env.PUBLIC_URL + "/models";
        console.log("Attempting to load models from:", localModelUrl);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(localModelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(localModelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(localModelUrl)
        ]);
        
        setModelsLoaded(true);
        console.log("Models loaded successfully from local directory");
      } catch (localError) {
        console.error("Local model loading failed:", localError);
        
        // If local loading fails, try loading from CDN
        try {
          console.log("Attempting to load models from CDN...");
          const cdnModelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';
          
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(cdnModelUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(cdnModelUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(cdnModelUrl)
          ]);
          
          setModelsLoaded(true);
          console.log("Models loaded successfully from CDN");
        } catch (cdnError) {
          console.error("CDN model loading failed:", cdnError);
          setLoadingError(`Failed to load models from both local and CDN sources. ${cdnError.message}`);
          toast.error("Face detection unavailable. Please check console for details.");
        }
      }
    };

    loadModels();
  }, []);

  // Handle CNIC Search
  const handleCnicSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a CNIC number");
      return;
    }

    if (searchTerm.length !== 13 || !/^\d+$/.test(searchTerm)) {
      toast.error("Please enter a valid 13-digit CNIC number");
      return;
    }

    setIsSearching(true);

    try {
      const usersRef = collection(db, "AdminAddedUsers");
      const q = query(usersRef, where("idCardNumber", "==", searchTerm));
      const querySnapshot = await getDocs(q);

      const results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });

      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No users found with this CNIC number");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaceImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Handle face image search with model verification
  const handleImageSearch = async (e) => {
    e.preventDefault();
    
    if (!faceImage) {
      toast.error("Please select an image to search");
      return;
    }
    
    if (!modelsLoaded) {
      toast.error("Face detection models are still loading. Please wait.");
      return;
    }
    
    if (loadingError) {
      toast.error("Face detection is unavailable due to loading error");
      return;
    }

    setIsSearching(true);

    try {
      // Convert image to format face-api.js can process
      const image = await faceapi.bufferToImage(faceImage);
      
      // Verify models are properly loaded
      if (!faceapi.nets.tinyFaceDetector.params) {
        throw new Error("Face detection model not properly initialized");
      }

      // Detect face with enhanced options
      const detection = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,  // Higher resolution for better accuracy
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("No face detected in the uploaded image. Please try a clearer photo.");
        setIsSearching(false);
        return;
      }

      const uploadedDescriptor = detection.descriptor;

      // Get all users from Firestore
      const usersRef = collection(db, "AdminAddedUsers");
      const querySnapshot = await getDocs(usersRef);

      const allUsers = [];
      querySnapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() });
      });

      const matches = [];

      // Compare with each user's face
      for (let user of allUsers) {
        if (!user.faceImageUrl) continue;

        try {
          const img = await faceapi.fetchImage(user.faceImageUrl);
          const userDetection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!userDetection) continue;

          // Calculate similarity (lower distance = more similar)
          const distance = faceapi.euclideanDistance(
            uploadedDescriptor,
            userDetection.descriptor
          );

          // Threshold for considering a match (0.6 is standard)
          if (distance < 0.6) {
            matches.push({
              ...user,
              matchScore: (1 - distance).toFixed(2)  // Add match score (0-1)
            });
          }
        } catch (err) {
          console.error("Error processing user image:", user.faceImageUrl, err);
        }
      }

      // Sort matches by highest score first
      matches.sort((a, b) => b.matchScore - a.matchScore);

      if (matches.length > 0) {
        setSearchResults(matches);
        toast.success(`Found ${matches.length} matching user(s)`);
      } else {
        setSearchResults([]);
        toast.info("No matching users found. Try a different photo.");
      }
    } catch (error) {
      console.error("Face comparison failed:", error);
      toast.error(`Error matching face: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Headeri />
      <InveNot />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Search Users</h1>

        {/* Model loading status indicator */}
        <div className="mb-6">
          {!modelsLoaded && !loadingError && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading face detection models (may take up to 1 minute)...
            </div>
          )}
          
          {loadingError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              <div className="font-bold">⚠️ Face Detection Unavailable</div>
              <div className="mt-1">{loadingError}</div>
              <div className="mt-2 text-sm">
                Troubleshooting steps:
                <ul className="list-disc pl-5 mt-1">
                  <li>Check browser console for details</li>
                  <li>Verify internet connection</li>
                  <li>Refresh the page to retry</li>
                  <li>CNIC search is still available</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* CNIC Search */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Search by CNIC</h2>
            <form onSubmit={handleCnicSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Number
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter 13-digit CNIC number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSearching ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSearching ? "Searching..." : "Search by CNIC"}
              </button>
            </form>
          </div>

          {/* Face Image Search */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Search by Face Image</h2>
            <form onSubmit={handleImageSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Face Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previewImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Image Preview:</p>
                    <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-200 relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching || !faceImage || !modelsLoaded || loadingError}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSearching || !faceImage || !modelsLoaded || loadingError ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSearching ? "Searching..." : "Search by Face"}
              </button>
            </form>
          </div>
        </div>

        {/* Search Results Table */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Search Results ({searchResults.length} {searchResults.length === 1 ? "match" : "matches"})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        {user.faceImageUrl ? (
                          <div className="flex flex-col items-start gap-2">
                            <img
                              src={user.faceImageUrl}
                              alt="User Face"
                              className="w-16 h-16 object-cover rounded-md border"
                            />
                            <a
                              href={user.faceImageUrl}
                              download={`UserFace_${user.idCardNumber}.jpg`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-xs hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.idCardNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.matchScore ? (
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${user.matchScore * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {(user.matchScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Personal Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">CNIC Number</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.idCardNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Father's Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.fatherName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Mother's Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.motherName}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email Address</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Address</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Additional Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Criminal Record</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.criminalRecord}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Created By</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.createdBy}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Created At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedUser.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {selectedUser.matchScore && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Match Confidence</label>
                          <div className="flex items-center mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${selectedUser.matchScore * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {(selectedUser.matchScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Face Image</h3>
                    {selectedUser.faceImageUrl ? (
                      <div className="flex flex-col items-start">
                        <img
                          src={selectedUser.faceImageUrl}
                          alt="User Face"
                          className="w-full max-w-xs rounded-md border"
                        />
                        <a
                          href={selectedUser.faceImageUrl}
                          download={`UserFace_${selectedUser.idCardNumber}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Download Image
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No face image available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminSearchUsers;