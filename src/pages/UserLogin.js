import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import HeaderLS from "../components/HeaderLS";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockTime, setLockTime] = useState(null);
  const navigate = useNavigate();

  // Check for locked account on component mount
  useEffect(() => {
    const lockedUntil = localStorage.getItem('accountLockedUntil');
    if (lockedUntil && new Date().getTime() < parseInt(lockedUntil)) {
      setAccountLocked(true);
      setLockTime(parseInt(lockedUntil));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Check if account is locked
    if (accountLocked) {
      const remainingTime = Math.ceil((lockTime - new Date().getTime()) / (1000 * 60));
      toast.error(`Account locked. Please try again after ${remainingTime} minutes.`);
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Reset failed attempts on successful login
      setFailedAttempts(0);

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
        toast.error("⚠️ User data not found.");
      }
    } catch (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        // Lock account for 1 hour
        const lockUntil = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
        setAccountLocked(true);
        setLockTime(lockUntil);
        localStorage.setItem('accountLockedUntil', lockUntil.toString());
        toast.error("⚠️ Too many failed attempts. Account locked for 1 hour.");
      } else {
        toast.error(`⚠️ Invalid email or password. ${5 - newAttempts} attempts remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent. Please check your inbox.");
      setShowForgotPassword(false);
    } catch (error) {
      toast.error("Error sending reset email. Please check the email address.");
    }
  };

  return (
    <div className="bg-gray-200">
      <ToastContainer />
      <HeaderLS />
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 ">User Login</h2>
          
          {showForgotPassword ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-center">Reset Password</h3>
              <p className="text-sm text-gray-600">Enter your email to receive a password reset link</p>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleForgotPassword}
                  className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Send Reset Link
                </button>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
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
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading || accountLocked}
                    className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Logging in..." : accountLocked ? "Account Locked" : "Login"}
                  </button>
                </div>
              </form>
              <p className="text-center text-sm text-gray-600">
                Don't have an account? <a href="/User/Signup" className="font-medium text-gray-600 hover:underline">Signup</a>
              </p>
              <p className="text-center text-sm text-gray-600">
                Investigator? <a href="/Investigator/login" className="font-medium text-gray-600 hover:underline">Login here</a>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;