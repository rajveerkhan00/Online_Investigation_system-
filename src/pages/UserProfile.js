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

  // Redirect to login if not authenticated
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
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
        <TailSpin color="#6366f1" height={80} width={80} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-300 min-h-screen flex flex-col">
      <HeaderLS />
      <Chatbot />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white/90 rounded-2xl shadow-2xl border border-gray-200 backdrop-blur-md transition-all duration-300 hover:shadow-3xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg mb-4">
              <span className="text-4xl text-white font-bold">
                {userData?.name
                  ? userData.name.charAt(0).toUpperCase()
                  : userData?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2 font-serif tracking-wide">
              {userData?.name || "User"}
            </h1>
            <span
              className={`inline-block text-base font-semibold px-4 py-1 rounded-full shadow-sm border ${
                emailVerified
                  ? "bg-green-100 text-green-700 border-green-400"
                  : "bg-red-100 text-red-700 border-red-400"
              }`}
            >
              {emailVerified ? "Verified ✔️" : "Not Verified ❌"}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-inner">
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Email</h2>
            <p className="text-gray-800 font-mono text-base break-all">{userData?.email}</p>
            {!emailVerified && (
              <div className="flex justify-center mt-3">
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md shadow hover:bg-yellow-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm"
                  onClick={sendVerificationEmail}
                >
                  Verify Email
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 flex flex-col items-center">
            {/* Change Password Button */}
            <button
              className="w-full max-w-[220px] bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-md shadow-md hover:from-yellow-500 hover:to-yellow-700 transition-transform transform hover:scale-105 duration-300 font-medium text-base"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              Change Password
            </button>

            {showPasswordFields && (
              <div className="w-full max-w-[220px] space-y-3 bg-white rounded-lg p-4 shadow">
                <input
                  type="password"
                  placeholder="Old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="New password (min 8 chars)"
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
                  className="w-full bg-indigo-700 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-800 transition-transform transform hover:scale-105 duration-300 font-medium text-base"
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
              className="w-full max-w-[220px] bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 rounded-md shadow-md hover:from-red-600 hover:to-red-800 transition-transform transform hover:scale-105 duration-300 font-medium text-base"
              onClick={() => setShowDeleteFields(!showDeleteFields)}
            >
              Delete Account
            </button>

            {showDeleteFields && (
              <div className="w-full max-w-[220px] space-y-3 bg-white rounded-lg p-4 shadow">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  className="w-full bg-red-700 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-800 transition-transform transform hover:scale-105 duration-300 font-medium text-base"
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
              className="w-full max-w-[220px] bg-gradient-to-r from-gray-500 to-gray-700 text-white px-4 py-2 rounded-md shadow-md hover:from-gray-600 hover:to-gray-800 transition-transform transform hover:scale-105 duration-300 font-medium text-base"
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