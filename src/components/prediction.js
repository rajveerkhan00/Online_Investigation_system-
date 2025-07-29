import React, { useState } from 'react';
import axios from 'axios';

function PredictionFloatingButton() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [criminalLikelihood, setCriminalLikelihood] = useState(null);

  const uploadFile = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('media', file);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/analyze', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResults(res.data.emotions);
      setCriminalLikelihood(res.data.estimatedCriminalLikelihood);
    } catch (e) {
      console.error('Error:', e);
      setResults([{ file: "Error", prediction: [{ emotion: "Error", confidence: 0 }] }]);
      setCriminalLikelihood("Error");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed left-6 bottom-10 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
        aria-label="Open Emotion Analysis"
      >
        <span className="text-white text-3xl font-bold">😊</span>
      </button>

      {/* Floating Panel */}
      {open && (
        <div className="fixed left-6 bottom-28 z-50 w-96 max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-blue-200 p-6 animate-fade-in backdrop-blur-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-700">Emotion Analysis</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-red-500 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-3 block w-full text-sm text-gray-700"
          />
          <button
            onClick={uploadFile}
            disabled={!file || loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2 rounded-lg shadow hover:from-blue-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? "Processing..." : "Analyze"}
          </button>

          {criminalLikelihood && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <h4 className="font-bold text-red-700">Estimated Criminal Likelihood:</h4>
              <p className="text-red-900 font-semibold">{criminalLikelihood}</p>
            </div>
          )}

          <div className="mt-4 max-h-60 overflow-y-auto">
            {results.map((r, idx) => (
              <div key={idx} className="mb-4 bg-blue-50 rounded-lg p-3 shadow-inner">
                <h4 className="font-semibold text-blue-800">{r.file}</h4>
                <ul className="ml-4 mt-2">
                  {r.prediction.map((p, i) => (
                    <li key={i} className="text-gray-700">
                      <span className="font-medium">{p.emotion}:</span> {p.confidence}%
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default PredictionFloatingButton;