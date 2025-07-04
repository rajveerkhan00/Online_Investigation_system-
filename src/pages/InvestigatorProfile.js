import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  updatePassword,
  sendEmailVerification,
} from "firebase/auth";
import { getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Headeri from "../components/Headeri";
import Footeri from "../components/Footeri";
import { TailSpin } from "react-loader-spinner";

const Profile = () => {
  const [investigator, setInvestigator] = useState(null);
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

 useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      toast.error("No user found. Please log in.");
      navigate("/Investigator/Login");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "investigatordata", user.uid));
      if (userDoc.exists()) {
        setInvestigator(userDoc.data());
        setEmailVerified(user.emailVerified);
      } else {
        toast.error("User data not found.");
      }
    } catch (error) {
      toast.error("Error fetching profile data.");
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe(); // Clean up the listener on unmount
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
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);

      toast.success("Account deleted successfully!");
      navigate("/Investigator/Login");
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
    navigate("/Investigator/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50">
        <TailSpin color="#6366f1" height={80} width={80} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
  <Headeri />
  <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

  <main className="flex-grow flex items-center justify-center p-6">
    <div className="w-full max-w-2xl bg-white/70 dark:bg-white/10 backdrop-blur-lg shadow-2xl rounded-2xl p-8 sm:p-10 text-center transition-all hover:scale-[1.01] duration-300">
      <h1 className="text-3xl sm:text-4xl font-extrabold font-serif italic tracking-wide text-gray-800 dark:text-white mb-10">
        Investigator Profile
      </h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Your Email
        </h2>
        <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">
          {investigator?.email}
        </p>
        <span
          className={`mt-4 inline-block px-4 py-2 text-sm font-semibold rounded-full ${
            emailVerified
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {emailVerified ? "Verified ✔️" : "Not Verified ❌"}
        </span>

        {!emailVerified && (
          <button
            className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full shadow transition-transform transform hover:scale-105"
            onClick={sendVerificationEmail}
          >
            Verify Email
          </button>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center space-y-4">
        {/* Change Password */}
        <button
          className="w-full max-w-xs bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-full shadow-md transition-transform transform hover:scale-105"
          onClick={() => setShowPasswordFields(!showPasswordFields)}
        >
          Change Password
        </button>

        {showPasswordFields && (
          <div className="space-y-4 w-full max-w-sm mt-4">
            <input
              type="password"
              placeholder="Old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-full transition-transform transform hover:scale-105"
              onClick={handlePasswordChange}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <TailSpin color="#fff" height={20} width={20} />
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        )}

        {/* Delete Account */}
        <button
          className="w-full max-w-xs bg-red-500 hover:bg-red-600 text-white py-3 rounded-full shadow-md transition-transform transform hover:scale-105"
          onClick={() => setShowDeleteFields(!showDeleteFields)}
        >
          Delete Account
        </button>

        {showDeleteFields && (
          <div className="space-y-4 w-full max-w-sm mt-4">
            <input
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button
              className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-full transition-transform transform hover:scale-105"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <TailSpin color="#fff" height={20} width={20} />
              ) : (
                "Delete Account"
              )}
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          className="w-full max-w-xs bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-full shadow-md transition-transform transform hover:scale-105"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  </main>

  <Footeri />
</div>

  );
};

export default Profile;
