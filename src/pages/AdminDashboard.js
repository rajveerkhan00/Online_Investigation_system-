import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Import Firebase
import { collection, getDocs } from "firebase/firestore";
import { FaUsers, FaUserShield, FaClipboardList, FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa"; // Import icons
import Header from "../components/HeaderA"

const AdminDashboard = () => {
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalInvestigators, setTotalInvestigators] = useState(0);
    const [totalCases, setTotalCases] = useState(0);
    const [activeCases, setActiveCases] = useState(0);
    const [pendingCases, setPendingCases] = useState(0);
    const [solvedCases, setSolvedCases] = useState(0);
    const [rejectedCases, setRejectedCases] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch data from Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch total users
                const usersSnapshot = await getDocs(collection(db, "usersdata"));
                setTotalUsers(usersSnapshot.size);

                // Fetch total investigators
                const investigatorsSnapshot = await getDocs(collection(db, "investigatordata"));
                setTotalInvestigators(investigatorsSnapshot.size);

                // Fetch cases data
                const casesSnapshot = await getDocs(collection(db, "firs"));
                setTotalCases(casesSnapshot.size);

                // Calculate case status counts
                let active = 0;
                let pending = 0;
                let solved = 0;
                let rejected = 0;

                casesSnapshot.forEach((doc) => {
                    const caseData = doc.data();
                    switch (caseData.status) {
                        case "Active":
                            active++;
                            break;
                        case "Pending":
                            pending++;
                            break;
                        case "Solved":
                            solved++;
                            break;
                        case "Rejected":
                            rejected++;
                            break;
                        default:
                            break;
                    }
                });

                setActiveCases(active);
                setPendingCases(pending);
                setSolvedCases(solved);
                setRejectedCases(rejected);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div>            <Header />

        <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-6 mt-20">
            <h1 className="mb-10 text-2xl sm:text-3xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8 text-left">Admin Dashboard</h1>

            {loading ? (
                <p className="text-center text-gray-600">Loading...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Total Users Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                                <p className="text-sm text-gray-500">Registered users</p>
                            </div>
                            <FaUsers className="text-4xl text-blue-500" />
                        </div>
                    </div>

                    {/* Total Investigators Card */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Total Investigators</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{totalInvestigators}</p>
                                <p className="text-sm text-gray-500">Registered investigators</p>
                            </div>
                            <FaUserShield className="text-4xl text-green-500" />
                        </div>
                    </div>

                    {/* Total Cases Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Total Cases</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{totalCases}</p>
                                <p className="text-sm text-gray-500">Total cases reported</p>
                            </div>
                            <FaClipboardList className="text-4xl text-purple-500" />
                        </div>
                    </div>

                    {/* Active Cases Card */}
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Active Cases</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{activeCases}</p>
                                <p className="text-sm text-gray-500">Currently active cases</p>
                            </div>
                            <FaHourglassHalf className="text-4xl text-yellow-500" />
                        </div>
                    </div>

                    {/* Pending Cases Card */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Pending Cases</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCases}</p>
                                <p className="text-sm text-gray-500">Cases under review</p>
                            </div>
                            <FaHourglassHalf className="text-4xl text-orange-500" />
                        </div>
                    </div>

                    {/* Solved Cases Card */}
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Solved Cases</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{solvedCases}</p>
                                <p className="text-sm text-gray-500">Cases resolved</p>
                            </div>
                            <FaCheckCircle className="text-4xl text-teal-500" />
                        </div>
                    </div>

                    {/* Rejected Cases Card */}
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">Rejected Cases</h2>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{rejectedCases}</p>
                                <p className="text-sm text-gray-500">Cases rejected</p>
                            </div>
                            <FaTimesCircle className="text-4xl text-red-500" />
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default AdminDashboard;