import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminSignup = () => {
    const [formData, setFormData] = useState({
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
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await setDoc(doc(db, "admindata", user.uid), {
                email: user.email,
                role: "admin"
            });

            toast.success("✅ Signup successful! Redirecting to login...");
            setTimeout(() => navigate("/Admin/Login"), 1000);
            setFormData({ email: "", password: "", confirmPassword: "" });
        } catch (error) {
            toast.error(`⚠️ Signup failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#121212] min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
            <div className="relative w-4/5 sm:w-full max-w-md p-8 space-y-6 bg-[#1E1E1E] rounded-lg shadow-md border border-gray-700">
                <div className="absolute top-3 left-4 text-gray-400 font-semibold text-sm">
                    Admin / Signup
                </div>
                <h2 className="text-2xl font-bold text-center text-[#00D4FF]">Admin Signup</h2>
                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 bg-[#2A2A2A] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#00D4FF]"
                            placeholder="Enter admin email"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 bg-[#2A2A2A] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#00D4FF]"
                            placeholder="Enter admin password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 bg-[#2A2A2A] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#00D4FF]"
                            placeholder="Confirm your password"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-[#00D4FF] to-[#007BFF] rounded-lg hover:from-[#00A3CC] hover:to-[#005BBB] focus:ring-2 focus:ring-[#00D4FF] transition-all"
                        >
                            {loading ? "Signing up..." : "Signup as Admin"}
                        </button>
                    </div>
                </form>
                <p className="text-center text-sm text-gray-400">
                    Already have an account? <a href="/Admin/login" className="font-medium text-[#00D4FF] hover:underline">Login here</a>
                </p>
            </div>
        </div>
    );
};

export default AdminSignup;
