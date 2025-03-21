import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { auth } from "../firebase"; 
import { toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";

const Footer = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // Ensures auth is checked at least once

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecked(true); // Mark that authentication has been checked
    });
    return () => unsubscribe();
  }, []);

  const handleNavigation = (event, path) => {
    event.preventDefault(); // Prevent default navigation

    if (!authChecked) {
      setTimeout(() => {
        checkAndNavigate(path);
      }, 100);
    } else {
      checkAndNavigate(path);
    }
  };

  const checkAndNavigate = (path) => {
    const user = auth.currentUser; // Ensure real-time auth state
    if (!user) {
      toast.error("Please login/signup to proceed!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "colored",
      });
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-gray-200 text-gray-800 py-6 px-4 mt-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h3 className="text-lg font-bold">The Investigation System</h3>
          <p className="text-sm">Report anything here</p>
        </div>

        <div className="flex space-x-4 mb-4 md:mb-0">
          {["facebook-f", "twitter", "linkedin-in", "instagram"].map((icon, index) => (
            <button key={index} className="text-gray-600 hover:text-gray-700">
              <i className={`fa-brands fa-${icon} text-lg`}></i>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto flex flex-wrap justify-center md:justify-start mt-6">
        {[ 
          { title: "OUR WEBSITE", links: [{ name: "HOME", path: "/User/Home" }, { name: "ABOUT US", path: "/About" }] },
          { title: "CONTACT", links: [{ name: "CONTACT US", path: "/User/Contact" }, { name: "GIVE FEEDBACK", path: "/User/Feedback" }] },
          { title: "MAJOR", links: [{ name: "OUR DUCTS", path: "/major-ducts" }, { name: "MAJOR DUCTS", path: "/major-ducts" }] }
        ].map((section, idx) => (
          <div key={idx} className="w-1/2 md:w-1/4 px-2 mb-4 text-center md:text-left">
            <h2 className="font-medium text-gray-900 text-sm mb-2">{section.title}</h2>
            <ul>
              {section.links.map((link, index) => (
                <li key={index}>
                  <button 
                    onClick={(e) => handleNavigation(e, link.path)} 
                    className="text-gray-700 hover:text-gray-800"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
