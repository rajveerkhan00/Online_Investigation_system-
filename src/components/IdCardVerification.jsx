import React, { useState, useEffect } from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Initialize Cloudinary
const cld = new Cloudinary({ cloud: { cloudName: "dtv5vzkms" } });

const IDCardPreview = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Your ID Card</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <img 
              src={imageUrl} 
              className="w-full h-auto object-contain"
              alt="ID Card"
            />
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerificationStatusButton = ({ isVerified, onClick, idCardUrl }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleClick = () => {
    if (isVerified && idCardUrl) {
      setShowPreview(true);
    } else {
      onClick();
    }
  };

  return (
    <div className="absolute top-[125px] right-6 z-50">
      <button
        onClick={handleClick}
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          isVerified 
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        } shadow-md transition-all`}
      >
        {isVerified ? (
          <span className="flex items-center">
            Verified
            <svg className="ml-1 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        ) : (
          <span className="flex items-center">
            Not Verified
            <svg className="ml-1 h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </button>

      {showPreview && (
        <IDCardPreview 
          imageUrl={idCardUrl}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

const VerificationModal = ({ isOpen, onClose, onVerify, userId }) => {
  const [idCardFront, setIdCardFront] = useState("");
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const verifyIdCard = async (imageUrl) => {
    try {
      setVerifying(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('idCardImage', blob, 'id-card.jpg');

      const apiResponse = await fetch('http://localhost:5000/api/verify-id', {
        method: 'POST',
        body: formData,
      });

      const result = await apiResponse.json();

      if (!result.success) throw new Error(result.error || 'Verification failed');
      
      return result.verified;
    } catch (error) {
      toast.error(error.message || "Verification failed");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const saveVerificationData = async (imageUrl, isVerified) => {
    try {
      if (!userId) throw new Error("No user ID available");
      
      const verificationData = {
        userId,
        idCardImageUrl: imageUrl,
        isVerified,
        verifiedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'verifications', userId), verificationData);
      await setDoc(doc(db, 'users', userId), { isVerified }, { merge: true });
      
      return true;
    } catch (error) {
      console.error("Error saving verification data:", error);
      toast.error("Failed to save verification data");
      return false;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "my_preset");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dtv5vzkms/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await response.json();
      if (data.secure_url) {
        setIdCardFront(data.secure_url);
        const verified = await verifyIdCard(data.secure_url);
        
        if (verified) {
          const saved = await saveVerificationData(data.secure_url, verified);
          
          if (saved) {
            toast.success("ID card verified and saved!");
            onVerify(true, data.secure_url);
            onClose();
          }
        } else {
          toast.error("Not a valid ID card");
        }
      }
    } catch (error) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Verify Your ID Card</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Front Side of Your ID Card
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Select a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading || verifying}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>
          </div>

          {idCardFront && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
              <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                <img 
                  src={idCardFront} 
                  className="mx-auto max-h-48 object-contain w-full"
                  alt="ID Card Front"
                />
              </div>
            </div>
          )}

          {(uploading || verifying) && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {uploading && "Uploading image..."}
                {verifying && "Verifying ID card..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IDVerification = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [idCardUrl, setIdCardUrl] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        await checkVerificationStatus(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkVerificationStatus = async (uid) => {
    try {
      // First check the verifications collection
      const verificationDoc = await getDoc(doc(db, 'verifications', uid));
      
      if (verificationDoc.exists()) {
        const data = verificationDoc.data();
        setIsVerified(data.isVerified || false);
        setIdCardUrl(data.idCardImageUrl || null);
        return;
      }

      // Fallback to check user document
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsVerified(userData.isVerified || false);
        
        // If user is verified but we don't have URL, try to get it
        if (userData.isVerified && !idCardUrl) {
          const verificationData = await getDoc(doc(db, 'verifications', uid));
          if (verificationData.exists()) {
            setIdCardUrl(verificationData.data().idCardImageUrl || null);
          }
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  const handleVerify = (verified, imageUrl = null) => {
    setIsVerified(verified);
    if (imageUrl) {
      setIdCardUrl(imageUrl);
    }
  };

  return (
    <>
      <VerificationStatusButton 
        isVerified={isVerified} 
        onClick={() => setShowModal(true)} 
        idCardUrl={idCardUrl}
      />
      
      <VerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onVerify={handleVerify}
        userId={userId}
      />
    </>
  );
};

export default IDVerification;