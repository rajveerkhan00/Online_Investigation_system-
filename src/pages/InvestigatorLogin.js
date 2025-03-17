import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import Footer from "../components/Footer";
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

      // Fetch investigator role from Firestore
      const userDoc = await getDoc(doc(db, "investigatordata", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "investigator") {
          localStorage.setItem("userId", user.uid);
          toast.success("✅ Login successful!", { autoClose: 3000 });
          setTimeout(() => navigate("/Investigator/Home"), 1000);
        } else {
          toast.error("⚠️ Access denied. Not an investigator.", { autoClose: 3000 });
        }
      } else {
        toast.error("❌ User data not found.", { autoClose: 3000 });
      }
    } catch (error) {
      toast.error("⚠️ Login failed. Please check your credentials.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-200">
      <ToastContainer />
      <HeaderLS />

      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-800">Investigator Login</h2>
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
                className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600">
            Don't have an account? <a href="/Investigator/Signup" className="font-medium text-gray-600 hover:underline">Signup here</a>
          </p>
          <p className="text-center text-sm text-gray-600">
            User? <a href="/User/Login" className="font-medium text-gray-600 hover:underline">Login here</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default InvestigatorLogin;