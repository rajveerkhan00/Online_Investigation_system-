import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { auth } from "../firebase"; 
import { toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";

const Footer = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe(); // Cleanup function
  }, []);

  // Function to handle navigation with authentication check
  const handleNavigation = (path) => {
    if (!currentUser) {
      toast.error("Login/Signup first to access this feature!", {
        position: "top-right",
        autoClose: 3000,
      });
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-gray-200 text-gray-800 py-6 px-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Brand and Description */}
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h3 className="text-lg font-bold">The Investigation System</h3>
          <p className="text-sm">Report anything here</p>
        </div>

        {/* Social Media Links */}
        <div className="flex space-x-4 mb-4 md:mb-0">
          <a href="#" className="text-gray-600 hover:text-gray-700">
            <i className="fa-brands fa-facebook-f text-lg"></i>
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-700">
            <i className="fa-brands fa-twitter text-lg"></i>
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-700">
            <i className="fa-brands fa-linkedin-in text-lg"></i>
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-700">
            <i className="fa-brands fa-instagram text-lg"></i>
          </a>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="container mx-auto flex flex-wrap justify-center md:justify-start mt-6">
        {/* Section 1 */}
        <div className="w-1/2 md:w-1/4 px-2 mb-4 text-center md:text-left">
          <h2 className="font-medium text-gray-900 text-sm mb-2">OUR WEBSITE</h2>
          <ul>
            <li>
              <button onClick={() => handleNavigation("/User/Home")} className="text-gray-700 hover:text-gray-800">
                HOME
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation("/About")} className="text-gray-700 hover:text-gray-800">
                ABOUT US
              </button>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="w-1/2 md:w-1/4 px-2 mb-4 text-center md:text-left">
          <h2 className="font-medium text-gray-900 text-sm mb-2">CONTACT</h2>
          <ul>
            <li>
              <button onClick={() => handleNavigation("/User/Contact")} className="text-gray-700 hover:text-gray-800">
                CONTACT US
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation("/User/Feedback")} className="text-gray-700 hover:text-gray-800">
                GIVE FEEDBACK
              </button>
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="w-1/2 md:w-1/4 px-2 mb-4 text-center md:text-left">
          <h2 className="font-medium text-gray-900 text-sm mb-2">MAJOR</h2>
          <ul>
            <li>
              <button onClick={() => handleNavigation("/major-ducts")} className="text-gray-700 hover:text-gray-800">
                OUR DUCTS
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation("/major-ducts")} className="text-gray-700 hover:text-gray-800">
                MAJOR DUCTS
              </button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
