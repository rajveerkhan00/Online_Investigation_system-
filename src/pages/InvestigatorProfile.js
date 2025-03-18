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
    const fetchInvestigator = async () => {
      const user = auth.currentUser;
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
    };

    fetchInvestigator();
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
    <div className=" flex flex-col bg-gradient-to-r from-blue-50 to-purple-50">
      <Headeri />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="flex-grow h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg p-8 text-center shadow-2xl transform transition-all hover:scale-105">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">
            Profile
          </h1>
          <div className="mt-6 text-gray-700 flex flex-col items-center">
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 w-full max-w-md text-center">
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 font-serif italic tracking-wide">Your Email</h2>
    <p className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold text-center mb-6 sm:mb-8 mt-6 sm:mt-8
">{investigator?.email}</p>
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
      className="mt-4 bg-yellow-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105 duration-300"
      onClick={sendVerificationEmail}
    >
      Verify Email
    </button>
  )}
</div>
<div className="mt-8 space-y-4 flex flex-col items-center">
  {/* Change Password Button */}
  <button
    className="w-full max-w-[220px] bg-indigo-500 text-white py-2 sm:py-3 rounded-lg shadow-md hover:bg-indigo-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base"
    onClick={() => setShowPasswordFields(!showPasswordFields)}
  >
    Change Password
  </button>

  {showPasswordFields && (
    <div className="space-y-4 w-full max-w-[300px]">
      <input
        type="password"
        placeholder="Old password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        className="w-full bg-indigo-700 text-white py-2 sm:py-3 rounded-lg hover:bg-indigo-800 transition-transform transform hover:scale-105 duration-300"
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
    className="w-full max-w-[220px] bg-red-500 text-white py-2 sm:py-3 rounded-lg shadow-md hover:bg-red-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base"
    onClick={() => setShowDeleteFields(!showDeleteFields)}
  >
    Delete Account
  </button>

  {showDeleteFields && (
    <div className="space-y-4 w-full max-w-[300px]">
      <input
        type="password"
        placeholder="Enter your password"
        value={deletePassword}
        onChange={(e) => setDeletePassword(e.target.value)}
        className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
      <button
        className="w-full bg-red-700 text-white py-2 sm:py-3 rounded-lg hover:bg-red-800 transition-transform transform hover:scale-105 duration-300"
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
    className="w-full max-w-[220px] bg-gray-500 text-white py-2 sm:py-3 rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 duration-300 font-medium text-sm sm:text-base"
    onClick={handleLogout}
  >
    Logout
  </button>
</div>

        </div>
      </div>
      <Footeri />
    </div>
  );
};

export default Profile;
