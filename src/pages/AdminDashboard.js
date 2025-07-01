import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  FaUsers,
  FaUserShield,
  FaClipboardList,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
} from "react-icons/fa";
import Header from "../components/HeaderA";
import Adminnav from "../components/Adminnav";
import AppReq from "../components/ApprovalRequests";
import TInvestigators from "../components/TInvestigators";
import TUsers from "../components/TotalUser";
import TCases from "../components/TotalCases";
import ACases from "../components/ActiveCases";
import PCases from "../components/PendingCases";
import SCases from "../components/SolvedCases";
import USCases from "../components/UnSolvedCases";
import RCases from "../components/RejectedCases";

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInvestigators, setTotalInvestigators] = useState(0);
  const [totalCases, setTotalCases] = useState(0);
  const [activeCases, setActiveCases] = useState(0);
  const [pendingCases, setPendingCases] = useState(0);
  const [solvedCases, setSolvedCases] = useState(0);
  const [UnSolvedCases, setUnSolvedCases] = useState(0);
  const [rejectedCases, setRejectedCases] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInvestigators, setShowInvestigators] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showCases, setShowCases] = useState(false);
  const [showActiveCases, setShowActiveCases] = useState(false);
  const [showPendingCases, setShowPendingCases] = useState(false);
  const [showSolvedCases, setShowSolvedCases] = useState(false);
  const [showUnSolvedCases, setShowUnSolvedCases] = useState(false);
  const [showRejectedCases, setShowRejectedCases] = useState(false);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total users
        const usersSnapshot = await getDocs(collection(db, "usersdata"));
        setTotalUsers(usersSnapshot.size);

        // Fetch total investigators
        const approvedInvestigatorsQuery = query(
          collection(db, "investigatordata"),
          where("status", "==", "approved")
        );

        const investigatorsSnapshot = await getDocs(approvedInvestigatorsQuery);
        setTotalInvestigators(investigatorsSnapshot.size);

        // Fetch cases data
        const casesSnapshot = await getDocs(collection(db, "firs"));
        setTotalCases(casesSnapshot.size);

        // Calculate case status counts
        let active = 0;
        let pending = 0;
        let solved = 0;
        let UnSolved = 0;
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
            case "UnSolved":
              UnSolved++;
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
        setUnSolvedCases(UnSolved);
        setRejectedCases(rejected);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleInvestigators = () => {
    setShowInvestigators(!showInvestigators);
    setShowUsers(false);
    setShowCases(false);
    resetCaseViews();
  };

  const toggleUsers = () => {
    setShowUsers(!showUsers);
    setShowInvestigators(false);
    setShowCases(false);
    resetCaseViews();
  };

  const toggleCases = () => {
    setShowCases(!showCases);
    setShowInvestigators(false);
    setShowUsers(false);
    resetCaseViews();
  };

  const resetCaseViews = () => {
    setShowActiveCases(false);
    setShowPendingCases(false);
    setShowSolvedCases(false);
    setShowUnSolvedCases(false);
    setShowRejectedCases(false);
  };

  const toggleActiveCases = () => {
    resetAllViews();
    setShowActiveCases(true);
  };

  const togglePendingCases = () => {
    resetAllViews();
    setShowPendingCases(true);
  };

  const toggleSolvedCases = () => {
    resetAllViews();
    setShowSolvedCases(true);
  };

  const toggleUnSolvedCases = () => {
    resetAllViews();
    setShowUnSolvedCases(true);
  };

  const toggleRejectedCases = () => {
    resetAllViews();
    setShowRejectedCases(true);
  };

  const resetAllViews = () => {
    setShowInvestigators(false);
    setShowUsers(false);
    setShowCases(false);
    resetCaseViews();
  };

  return (
    <div>
      <Header />
      <Adminnav />
      <AppReq />
      
      <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-6 mt-20">
        <h1 className="mb-10 text-2xl sm:text-3xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8 text-left">
          Admin Dashboard
        </h1>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Total Users Card - CLICKABLE */}
              <div
                onClick={toggleUsers}
                className="cursor-pointer bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                    <p className="text-sm text-gray-500">Registered users</p>
                  </div>
                  <FaUsers className="text-4xl text-blue-500" />
                </div>
              </div>

              {/* Total Investigators Card - CLICKABLE */}
              <div
                onClick={toggleInvestigators}
                className="cursor-pointer bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Total Investigators</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalInvestigators}</p>
                    <p className="text-sm text-gray-500">Registered investigators</p>
                  </div>
                  <FaUserShield className="text-4xl text-green-500" />
                </div>
              </div>

              {/* Total Cases Card - CLICKABLE */}
              <div
                onClick={toggleCases}
                className="cursor-pointer bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Total Cases</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalCases}</p>
                    <p className="text-sm text-gray-500">Total cases reported</p>
                  </div>
                  <FaClipboardList className="text-4xl text-purple-500" />
                </div>
              </div>

              {/* Active Cases Card - CLICKABLE */}
              <div
                onClick={toggleActiveCases}
                className="cursor-pointer bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Active Cases</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{activeCases}</p>
                    <p className="text-sm text-gray-500">Currently active cases</p>
                  </div>
                  <FaHourglassHalf className="text-4xl text-yellow-500" />
                </div>
              </div>

              {/* Pending Cases Card - CLICKABLE */}
              <div
                onClick={togglePendingCases}
                className="cursor-pointer bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Pending Cases</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCases}</p>
                    <p className="text-sm text-gray-500">Cases under review</p>
                  </div>
                  <FaHourglassHalf className="text-4xl text-orange-500" />
                </div>
              </div>

              {/* Solved Cases Card - CLICKABLE */}
              <div
                onClick={toggleSolvedCases}
                className="cursor-pointer bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Solved Cases</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{solvedCases}</p>
                    <p className="text-sm text-gray-500">Cases resolved</p>
                  </div>
                  <FaCheckCircle className="text-4xl text-teal-500" />
                </div>
              </div>

              {/* UnSolved Cases Card - CLICKABLE */}
              <div
                onClick={toggleUnSolvedCases}
                className="cursor-pointer bg-gradient-to-r from-red-100 to-red-150 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">UnSolved Cases</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{UnSolvedCases}</p>
                    <p className="text-sm text-gray-500">Total UnSolved Cases</p>
                  </div>
                  <FaTimesCircle className="text-4xl text-teal-500" />
                </div>
              </div>

              {/* Rejected Cases Card - CLICKABLE */}
              <div
                onClick={toggleRejectedCases}
                className="cursor-pointer bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
              >
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

            {/* Show TInvestigators Component when investigators card is clicked */}
            {showInvestigators && (
              <div className="mt-10">
                <TInvestigators />
              </div>
            )}

            {/* Show TUsers Component when users card is clicked */}
            {showUsers && (
              <div className="mt-10">
                <TUsers />
              </div>
            )}

            {/* Show TCases Component when cases card is clicked */}
            {showCases && (
              <div className="mt-10">
                <TCases />
              </div>
            )}

            {/* Show ACases Component when Active Cases card is clicked */}
            {showActiveCases && (
              <div className="mt-10">
                <ACases />
              </div>
            )}

            {/* Show PCases Component when Pending Cases card is clicked */}
            {showPendingCases && (
              <div className="mt-10">
                <PCases />
              </div>
            )}

            {/* Show SCases Component when Solved Cases card is clicked */}
            {showSolvedCases && (
              <div className="mt-10">
                <SCases />
              </div>
            )}

            {/* Show USCases Component when UnSolved Cases card is clicked */}
            {showUnSolvedCases && (
              <div className="mt-10">
                <USCases />
              </div>
            )}

            {/* Show RCases Component when Rejected Cases card is clicked */}
            {showRejectedCases && (
              <div className="mt-10">
                <RCases />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;