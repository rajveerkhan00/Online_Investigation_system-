import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footeri";
import HeaderSL from "../components/HeaderSL";

const InvestigatorSignup = () => {
  const [formData, setFormData] = useState({
    realName: "",
    username: "",
    email: "",
    phoneNumber: "",
    badgeNumber: "",
    stars: "",
    policeStation: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.realName.trim()) {
      toast.error("❌ Real name is required.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("❌ Passwords do not match.");
      return false;
    }
    
   const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{9,}$/;

if (!passwordRegex.test(formData.password)) {
  toast.error("❌ Password must be at least 9 characters long and include a letter, a number, and a special character.");
  return false;
}

    
    if (formData.phoneNumber && !/^\d{11}$/.test(formData.phoneNumber)) {
      toast.error("❌ Please enter a valid phone number (11 digits).");
      return false;
    }
    
    if (formData.stars && (formData.stars < 1 || formData.stars > 5)) {
      toast.error("❌ Star rating must be between 1 and 5.");
      return false;
    }
    
    if (!formData.badgeNumber.trim()) {
      toast.error("❌ Badge number is required.");
      return false;
    }
    
    if (!formData.policeStation.trim()) {
      toast.error("❌ Police station is required.");
      return false;
    }
    
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Save investigator data to Firestore with "pending" status
      await setDoc(doc(db, "investigatordata", user.uid), {
        uid: user.uid,
        realName: formData.realName,
        username: formData.username,
        email: user.email,
        phoneNumber: formData.phoneNumber,
        badgeNumber: formData.badgeNumber,
        stars: parseInt(formData.stars) || 1,
        policeStation: formData.policeStation,
        role: "investigator",
        status: "pending", // Initial status
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        approved: false // Explicit approval flag
      });

      // Also create a document in the approvals collection
      await setDoc(doc(db, "approvals", user.uid), {
        userId: user.uid,
        email: user.email,
        realName: formData.realName,
        badgeNumber: formData.badgeNumber,
        policeStation: formData.policeStation,
        status: "pending",
        requestedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      toast.success("✅ Registration successful! Your account is pending admin approval.");
      setTimeout(() => navigate("/Investigator/Login"), 2000);

      // Reset form
      setFormData({
        realName: "",
        username: "",
        email: "",
        phoneNumber: "",
        badgeNumber: "",
        stars: "",
        policeStation: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(`⚠️ Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-200 min-h-screen flex flex-col">
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
      />
      <HeaderSL />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Investigator Registration</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please fill in all required fields to register as an investigator
            </p>
          </div>
          <form onSubmit={handleSignup} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="realName" className="block text-sm font-medium text-gray-700">
                  Full Legal Name *
                </label>
                <input
                  id="realName"
                  name="realName"
                  type="text"
                  value={formData.realName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your full legal name"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your official email"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10,15}"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="11 digits"
                />
              </div>

              <div>
                <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-700">
                  Badge Number *
                </label>
                <input
                  id="badgeNumber"
                  name="badgeNumber"
                  type="text"
                  value={formData.badgeNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your official badge number"
                />
              </div>

              <div>
                <label htmlFor="stars" className="block text-sm font-medium text-gray-700">
                  Rank/Stars *
                </label>
                <select
                  id="stars"
                  name="stars"
                  value={formData.stars}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select your rank</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              <div>
                <label htmlFor="policeStation" className="block text-sm font-medium text-gray-700">
                  Police Station *
                </label>
                <input
                  id="policeStation"
                  name="policeStation"
                  type="text"
                  value={formData.policeStation}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your assigned station"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Register as Investigator"
                )}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already registered?{" "}
              <a href="/Investigator/Login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InvestigatorSignup;