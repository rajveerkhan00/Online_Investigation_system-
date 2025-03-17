import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  updatePassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HeaderLS from "../components/HeaderLS";
import Footer from "../components/Footer";
import { TailSpin } from "react-loader-spinner";
import Chatbot from "../components/Chatbot";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showDeleteFields, setShowDeleteFields] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const navigate = useNavigate();

  // Fetch user data from Firestore
  useEffect(() => {
    // Use onAuthStateChanged to wait for Firebase Authentication to initialize
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("No user found. Please log in.");
        navigate("/User/Login"); // Redirect to login if no user is found
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "usersdata", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role === "user") {
            setUserData(data); // Set user data if role is "user"
            setEmailVerified(user.emailVerified);
          } else {
            toast.error("Unauthorized access. Only users can access this page.");
            navigate("/User/Login"); // Redirect if role is not "user"
          }
        } else {
          toast.error("User data not found.");
          navigate("/User/Login"); // Redirect if user data is not found
        }
      } catch (error) {
        toast.error("Error fetching profile data.");
        navigate("/User/Login"); // Redirect on error
      } finally {
        setLoading(false);
      }
    });

    // Cleanup the observer when the component unmounts
    return () => unsubscribe();
  }, [navigate]);

  const handlePasswordChange = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      toast.warn("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password updated successfully!");
      setShowPasswordFields(false);
    } catch (error) {
      toast.error(`Failed to change password: ${error.message}`);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.warn("Please enter your password to delete account.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    setDeletingAccount(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "usersdata", user.uid));
      await deleteUser(user);

      toast.success("Account deleted successfully!");
      navigate("/User/Login");
    } catch (error) {
      toast.error(`Failed to delete account: ${error.message}`);
    } finally {
      setDeletingAccount(false);
    }
  };

  const sendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        toast.success("Verification email sent. Please check your inbox.");
      } catch (error) {
        toast.error(`Failed to send verification email: ${error.message}`);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
    toast.success("Logged out successfully!");
    navigate("/User/Login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <TailSpin color="#6366f1" height={80} width={80} />
      </div>
    );
  }

  return (
    <div className="bg-gray-200">
      <HeaderLS />
      <Chatbot />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-gray-100 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800">Profile</h1>

          {/* Display User Email */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Your Email</h2>
            <p className="text-lg text-gray-600">{userData?.email}</p>
            <span
              className={`inline-block text-lg font-semibold px-4 py-1 mt-3 rounded-full ${
                emailVerified
                  ? "bg-green-100 text-green-700 border border-green-400"
                  : "bg-red-100 text-red-700 border border-red-400"
              }`}
            >
              {emailVerified ? "Verified ✔️" : "Not Verified ❌"}
            </span>
          </div>

          {!emailVerified && (
            <button
              className="w-full bg-yellow-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105 duration-300"
              onClick={sendVerificationEmail}
            >
              Verify Email
            </button>
          )}

          <div className="mt-8 space-y-4">
            <button
              className="w-full bg-indigo-500 text-white py-3 rounded-lg hover:bg-indigo-600 transition-colors duration-300"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              Change Password
            </button>
            {showPasswordFields && (
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  className="w-full bg-indigo-700 text-white py-3 rounded-lg hover:bg-indigo-800 transition-colors duration-300"
                  onClick={handlePasswordChange}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? (
                    <TailSpin color="#FFFFFF" height={24} width={24} />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            )}

            <button
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors duration-300"
              onClick={() => setShowDeleteFields(!showDeleteFields)}
            >
              Delete Account
            </button>
            {showDeleteFields && (
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition-colors duration-300"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? (
                    <TailSpin color="#FFFFFF" height={24} width={24} />
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            )}

            <button
              className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors duration-300"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;