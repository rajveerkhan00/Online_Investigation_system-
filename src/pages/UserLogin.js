import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import HeaderLS from "../components/HeaderLS";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "usersdata", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "user") {
          toast.success("✅ Login successful! Redirecting...");
          setTimeout(() => navigate("/User/Home"), 1000);
        } else {
          toast.error("⚠️ Unauthorized access. Only users can log in here.");
        }
      } else {
        toast.error("⚠️ User data Not found.");
      }
    } catch (error) {
      toast.error("⚠️ Invalid email or password. Please try again.");
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
          <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
          <p className="text-center text-sm text-gray-600">
            Don't have an account? <a href="/User/Signup" className="font-medium text-gray-600 hover:underline">Signup</a>
          </p>
          <p className="text-center text-sm text-gray-600">
            Investigator? <a href="/Investigator/login" className="font-medium text-gray-600 hover:underline">Login here</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
