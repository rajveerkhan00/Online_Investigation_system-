import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import Footer from "../components/Footeri";
import HeaderLS from "../components/HeaderLS";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function InvestigatorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  // Track failed attempts and lock times in state
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const saved = localStorage.getItem("loginAttempts");
    return saved ? JSON.parse(saved) : {};
  });

  // Load saved attempts from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("loginAttempts");
    if (saved) {
      setLoginAttempts(JSON.parse(saved));
    }
  }, []);

  // Save attempts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));
  }, [loginAttempts]);

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      toast.success("Password reset email sent successfully!");
    } catch (error) {
      console.error("Error sending reset email:", error);
      let errorMessage = "Failed to send reset email. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if account is locked
  const isAccountLocked = (email) => {
    if (!loginAttempts[email]) return false;
    
    const { lockedUntil, attempts } = loginAttempts[email];
    
    // If lockedUntil exists and current time is before it, account is locked
    if (lockedUntil && Date.now() < lockedUntil) {
      return true;
    }
    
    // If account was locked but lock time has expired, reset the attempts
    if (lockedUntil && Date.now() >= lockedUntil) {
      const updatedAttempts = { ...loginAttempts };
      delete updatedAttempts[email];
      setLoginAttempts(updatedAttempts);
      return false;
    }
    
    // If there are 5 or more attempts but no lock time set
    if (attempts >= 5) {
      const updatedAttempts = {
        ...loginAttempts,
        [email]: {
          ...loginAttempts[email],
          lockedUntil: Date.now() + 60 * 60 * 1000 // Lock for 1 hour
        }
      };
      setLoginAttempts(updatedAttempts);
      return true;
    }
    
    return false;
  };

  // Handle failed login attempt
  const recordFailedAttempt = (email) => {
    const currentAttempts = loginAttempts[email] || { attempts: 0 };
    const newAttemptCount = currentAttempts.attempts + 1;
    
    let updatedAttempts = {
      ...loginAttempts,
      [email]: {
        attempts: newAttemptCount,
        lastAttemptTime: Date.now(),
        ...(newAttemptCount >= 5 ? { lockedUntil: Date.now() + 60 * 60 * 1000 } : {}) // Lock for 1 hour after 5 attempts
      }
    };
    
    setLoginAttempts(updatedAttempts);
    
    if (newAttemptCount >= 5) {
      toast.error(`❌ Account locked for 1 hour due to multiple failed attempts.`, {
        autoClose: 5000,
        closeButton: true
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if account is locked
    if (isAccountLocked(email)) {
      const lockedUntil = loginAttempts[email]?.lockedUntil;
      const timeLeft = Math.ceil((lockedUntil - Date.now()) / (60 * 1000));
      
      toast.error(`❌ Account locked. Please try again in ${timeLeft} minutes.`, { 
        autoClose: 5000,
        closeButton: true
      });
      setLoading(false);
      return;
    }

    try {
      // Sign in Investigator
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Reset failed attempts on successful login
      if (loginAttempts[email]) {
        const updatedAttempts = { ...loginAttempts };
        delete updatedAttempts[email];
        setLoginAttempts(updatedAttempts);
      }

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
        recordFailedAttempt(email);
        
        // Show remaining attempts message
        const currentAttempts = loginAttempts[email]?.attempts || 0;
        const remainingAttempts = 5 - (currentAttempts + 1);
        if (remainingAttempts > 0) {
          errorMessage += ` You have ${remainingAttempts} attempt(s) remaining.`;
        }
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
          {!showForgotPassword ? (
            <>
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
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading || isAccountLocked(email)}
                    className={`w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all ${
                      loading || isAccountLocked(email) ? "opacity-70 cursor-not-allowed" : ""
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
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 mt-6 sm:mt-8">
                Reset Password
              </h2>
              
              {resetSent ? (
                <div className="text-center">
                  <p className="text-green-600 mb-4">Password reset email has been sent to {resetEmail}.</p>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                    }}
                    className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Send Reset Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default InvestigatorLogin;