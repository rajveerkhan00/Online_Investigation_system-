import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import HeaderSL from "../components/HeaderSL";

const InvestigatorSignup = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("❌ Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Store investigator data in Firestore
            await setDoc(doc(db, "investigatordata", user.uid), {
                username: formData.username,
                email: user.email,
                role: "investigator"
            });

            toast.success("✅ Signup successful! Redirecting to login...");
            setTimeout(() => navigate("/Investigator/Login"), 1000);
            setFormData({ username: "", email: "", password: "", confirmPassword: "" });
        } catch (error) {
            toast.error(`⚠️ Signup failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-200">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
            <HeaderSL />
            <div className="pt-20 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
                <div className="relative w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-gray-100 rounded-lg shadow-md">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 mt-6 sm:mt-8 ">
                        Investigator / Signup
                    </div>
                    <h2 className="text-2xl font-bold text-center text-gray-800">Signup Now</h2>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm your password"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500"
                            >
                                {loading ? "Signing up..." : "Signup as Investigator"}
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-gray-600">
                        Already have an account? <a href="/Investigator/login" className="font-medium text-gray-600 hover:underline">Login here</a>
                    </p>
                    <p className="text-center text-sm text-gray-600">
                        Signup as a user instead? <a href="/User/Signup" className="font-medium text-gray-600 hover:underline">Signup</a>
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default InvestigatorSignup;