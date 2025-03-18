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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("No user found. Please log in.");
        navigate("/User/Login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "usersdata", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role === "user") {
            setUserData(data);
            setEmailVerified(user.emailVerified);
          } else {
            toast.error(
              "Unauthorized access. Only users can access this page."
            );
            navigate("/User/Login");
          }
        } else {
          toast.error("User data not found.");
          navigate("/User/Login");
        }
      } catch (error) {
        toast.error("Error fetching profile data.");
        navigate("/User/Login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handlePasswordChange = async () => {
    if (
      !oldPassword.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
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

    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    setDeletingAccount(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        deletePassword
      );
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
    <div className="bg-gray-200 min-h-screen flex flex-col">
      <HeaderLS />
      <Chatbot />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-200 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
            Profile
          </h1>

          {/* Display User Email */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
              Your Email
            </h2>
            <p className="text-xl sm:text-xl md:text-3xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 mt-6 sm:mt-8">
              {userData?.email}
            </p>
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
            <div className="flex justify-center">
              <button
                className="w-full max-w-[120px] bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base text-center"
                onClick={sendVerificationEmail}
              >
                Verify Email
              </button>
            </div>
          )}
          <div className="mt-8 space-y-3 flex flex-col items-center px-2">
            {/* Change Password Button */}
            <button
              className="w-full max-w-[200px] bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base text-center"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              Change Password
            </button>

            {showPasswordFields && (
              <div className="w-full max-w-[200px] space-y-3">
                <input
                  type="password"
                  placeholder="Old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  className="w-full max-w-[200px] bg-indigo-700 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-800 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base text-center"
                  onClick={handlePasswordChange}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? (
                    <TailSpin color="#FFFFFF" height={20} width={20} />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            )}

            {/* Delete Account Button */}
            <button
              className="w-full max-w-[200px] bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base text-center"
              onClick={() => setShowDeleteFields(!showDeleteFields)}
            >
              Delete Account
            </button>

            {showDeleteFields && (
              <div className="w-full max-w-[200px] space-y-3">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  className="w-full max-w-[200px] bg-red-700 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-800 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base text-center"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? (
                    <TailSpin color="#FFFFFF" height={20} width={20} />
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            )}

            {/* Logout Button */}
            <button
              className="w-full max-w-[200px] bg-gray-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base text-center"
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
