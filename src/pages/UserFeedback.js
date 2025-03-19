import React, { useState } from 'react';
import Footer from "../components/Footer";

function FeedbackForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Feedback submission failed');
            }

            setSuccessMessage("Thank you for your feedback!");
            setFormData({ name: '', email: '', message: '' }); // Reset form
        } catch (error) {
            setErrorMessage(error.message || "Feedback submission failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-200">
            <header className="flex items-center justify-between p-4 bg-gray-200 flex-wrap pt-6">
                <div className="flex items-center space-x-2">
                    <img src="favicon.webp" alt="Favicon" className="w-8 h-8 rounded-full" />
                    <h1 className="text-lg font-bold text-gray-800">Feedback System</h1>
                </div>
            </header>

            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
                <div className="w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-gray-100 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center text-gray-800">Share Your Feedback</h2>

                    {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
                    {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-600">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-600">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="4"
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your feedback"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                {loading ? "Submitting..." : "Submit Feedback"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default FeedbackForm;
