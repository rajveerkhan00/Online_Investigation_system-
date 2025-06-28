// src/CnicPage.js

import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function CnicPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setText("");
    setError("");
    setLoading(true);

    Tesseract.recognize(file, "eng+urd", {
      langPath: "https://tessdata.projectnaptha.com/4.0.0", // Optional: explicitly set CDN path
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        setText(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error("OCR error:", err);
        setError("Failed to process image.");
        setLoading(false);
      });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        CNIC Text Extractor (English + Urdu)
      </h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {loading && <p style={{ marginTop: "1rem" }}>Processing image...</p>}
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      {!loading && text && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            marginTop: "1rem",
            background: "#f2f2f2",
            padding: "1rem",
            borderRadius: "6px",
            direction: "rtl", // support for Urdu display
            textAlign: "right",
            fontFamily: "Noto Nastaliq Urdu, Arial, sans-serif", // optional: better Urdu font
          }}
        >
          {text}
        </pre>
      )}
    </div>
  );
}
