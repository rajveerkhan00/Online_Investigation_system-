import React, { useState } from "react";
import axios from "axios";

const CriminalPrediction = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please upload an image or video!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Criminal Behavior Prediction</h2>
      
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>Upload</button>

      {loading && <p>Processing...</p>}

      {result && (
        <div style={{ marginTop: "20px", border: "1px solid #ddd", padding: "10px" }}>
          <h3>Results:</h3>
          <p><strong>Emotion:</strong> {result.emotion}</p>
          <p><strong>Criminal Probability:</strong> {result.criminal_probability}</p>
        </div>
      )}
    </div>
  );
};

export default CriminalPrediction;
