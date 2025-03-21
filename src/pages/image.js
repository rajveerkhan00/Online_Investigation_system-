import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase"; // Ensure Firebase is configured
import { collection, addDoc, getDocs } from "firebase/firestore";

const ImageManager = () => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState([]);

  // Fetch images from Firestore on component load
  useEffect(() => {
    const fetchImages = async () => {
      const querySnapshot = await getDocs(collection(db, "images"));
      setImages(querySnapshot.docs.map((doc) => doc.data().url));
    };
    fetchImages();
  }, []);

  // Function to handle image upload
  const handleImageUpload = async () => {
    if (!image) return alert("Please select an image!");

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "my_preset"); // ✅ Your Upload Preset

    try {
      // Upload to Cloudinary
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dtv5vzkms/image/upload", // ✅ Your Cloud Name
        formData
      );

      const uploadedImageUrl = res.data.secure_url;
      setImageUrl(uploadedImageUrl);

      // Save to Firestore
      await addDoc(collection(db, "images"), { url: uploadedImageUrl });

      setImages((prev) => [uploadedImageUrl, ...prev]); // Update UI with new image
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed!");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Upload & View Images</h2>

      {/* Image Upload Section */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <input 
          type="file" 
          className="border p-2 rounded-md w-full max-w-xs" 
          onChange={(e) => setImage(e.target.files[0])} 
        />
        <button
          onClick={handleImageUpload}
          className="px-5 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition duration-300"
        >
          Upload Image
        </button>
      </div>

      {/* Display Uploaded Image */}
      {imageUrl && (
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Uploaded Image:</h3>
          <img 
            src={imageUrl} 
            alt="Uploaded" 
            className="w-40 h-40 object-cover rounded-md shadow-md mx-auto"
          />
        </div>
      )}

      {/* Display All Stored Images */}
      {images.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4 text-center">Stored Images:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt="Stored" 
                className="w-32 h-32 object-cover rounded-md shadow-md"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageManager;
