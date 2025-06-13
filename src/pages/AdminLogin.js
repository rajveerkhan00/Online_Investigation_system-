import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HeaderSL from "../components/HeaderSL"; 

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "admindata", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "admin") {
          localStorage.setItem("adminId", user.uid);
          toast.success("✅ Login successful!", { autoClose: 3000 });
          setTimeout(() => navigate("/Admin/Dashboard"), 1000);
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
    <>
          <HeaderSL />
    
    <div className="bg-gray-100 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-300">
        <h2 className="text-2xl font-bold text-center text-indigo-600">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 bg-white border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              placeholder="Enter Admin Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 bg-white border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              placeholder="Enter Password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg hover:from-indigo-600 hover:to-purple-600 focus:ring-2 focus:ring-indigo-400 transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default AdminLogin;
