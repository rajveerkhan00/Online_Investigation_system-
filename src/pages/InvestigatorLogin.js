import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import Footer from "../components/Footeri";
import HeaderLS from "../components/HeaderLS";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function InvestigatorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in Investigator
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch investigator data from Firestore
      const userDoc = await getDoc(doc(db, "investigatordata", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check if user is an investigator
        if (userData.role !== "investigator") {
          toast.error("⚠️ Access denied. Not an investigator.", { autoClose: 3000 });
          setLoading(false);
          return;
        }

        // Check approval status
        if (userData.status === "pending") {
          toast.info("⏳ Your account is pending approval. Please wait for admin confirmation.", { 
            autoClose: 5000,
            closeButton: true
          });
          setLoading(false);
          return;
        }

        if (userData.status === "rejected") {
          toast.error("❌ Your account has been rejected. Please contact admin.", { 
            autoClose: 5000,
            closeButton: true
          });
          setLoading(false);
          return;
        }

        if (userData.status === "approved" || userData.approved) {
          localStorage.setItem("userId", user.uid);
          toast.success("✅ Login successful!", { autoClose: 3000 });
          setTimeout(() => navigate("/Investigator/Home"), 1000);
        } else {
          toast.info("⏳ Your account is still being processed. Please wait for admin approval.", { 
            autoClose: 5000,
            closeButton: true
          });
        }
      } else {
        toast.error("❌ User data not found.", { autoClose: 3000 });
      }
    } catch (error) {
      let errorMessage = "⚠️ Login failed. Please check your credentials.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "❌ User not found. Please check your email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "❌ Incorrect password. Please try again.";
      }
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-200">
      <ToastContainer position="top-center" />
      <HeaderLS />

      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 mt-6 sm:mt-8">
            Investigator Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Password"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="/Investigator/Signup" className="font-medium text-blue-600 hover:underline">
                Signup here
              </a>
            </p>
            <p className="text-sm text-gray-600">
              User?{" "}
              <a href="/User/Login" className="font-medium text-blue-600 hover:underline">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default InvestigatorLogin;