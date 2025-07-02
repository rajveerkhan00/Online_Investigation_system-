import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Headeri from "../components/Headeri";
import Footer from "../components/Footeri";
import Navbari from "../components/Navbari";
import InveNot from "../components/InveNot";

const AdminSearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [faceImage, setFaceImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaceImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleImageSearch = async (e) => {
    e.preventDefault();
    if (!faceImage) {
      toast.error("Please select an image to search");
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "AdminAddedUsers");
      const querySnapshot = await getDocs(usersRef);

      const results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });

      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No matching users found");
      } else {
        toast.success(`Found ${results.length} potential matches`);
      }
    } catch (error) {
      console.error("Error searching by image:", error);
      toast.error("Failed to search by image");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Headeri />
      <Navbari />
      <InveNot />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Search Users</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Search by Face Image</h2>
            <form onSubmit={handleImageSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Face Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previewImage && (
                  <div className="mt-2 w-32 h-32 rounded-md overflow-hidden border border-gray-200">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching || !faceImage}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSearching || !faceImage ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSearching ? "Searching..." : "Search by Face"}
              </button>
            </form>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criminal Record</th>
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
                              Download Image
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.idCardNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.criminalRecord || "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminSearchUsers;
