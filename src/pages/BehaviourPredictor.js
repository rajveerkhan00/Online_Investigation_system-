import { useState } from "react";
import axios from "axios";

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a video file.");

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await axios.post("http://localhost:5000/upload-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResponse(res.data.result);
    } catch (error) {
      console.error(error);
      setResponse("Error analyzing video");
    }
  };

  return (
    <div className="p-6">
      <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} className="bg-blue-500 text-white p-2 mt-2 rounded">
        Upload Video
      </button>
      {response && <p className="mt-4">{response}</p>}
    </div>
  );
}
