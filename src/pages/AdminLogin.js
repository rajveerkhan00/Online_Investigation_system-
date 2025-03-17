import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in Admin
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch admin role from Firestore
      const userDoc = await getDoc(doc(db, "admindata", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "admin") {
          localStorage.setItem("adminId", user.uid);
          toast.success("✅ Login successful!", { autoClose: 3000 });
          setTimeout(() => navigate("/Admin/Home"), 1000);
        } else {
          toast.error("⚠️ Access denied. Not an admin.", { autoClose: 3000 });
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
    <div className="bg-[#121212] min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <ToastContainer />

      <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-[#1E1E1E] rounded-lg shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold text-center text-[#00D4FF]">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 bg-[#2A2A2A] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#00D4FF]"
              placeholder="Enter Admin Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 bg-[#2A2A2A] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#00D4FF]"
              placeholder="Enter Password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-[#00D4FF] to-[#007BFF] rounded-lg shadow-lg hover:from-[#00A3CC] hover:to-[#005BBB] focus:ring-2 focus:ring-[#00D4FF] transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400">
          Don't have an account? <a href="/Admin/Signup" className="font-medium text-[#00D4FF] hover:underline">Signup here</a>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
