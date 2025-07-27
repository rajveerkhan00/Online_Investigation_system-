import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { auth } from "../firebase"; 
import { toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";

const Footer = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigation = (event, path) => {
    event.preventDefault();

    if (!authChecked) {
      setTimeout(() => {
        checkAndNavigate(path);
      }, 100);
    } else {
      checkAndNavigate(path);
    }
  };

  const checkAndNavigate = (path) => {
    const user = auth.currentUser;
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
    <footer className="bg-blue-700 py-8 px-4 text-white mt-10 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white">The Investigation System</h3>
          <p className="text-blue-100">Report anything here</p>
        </div>

        <div className="flex space-x-6 mb-4 md:mb-0">
          {["facebook-f", "twitter", "linkedin-in", "instagram"].map((icon, index) => (
            <button 
              key={index} 
              className="hover:text-blue-200 transition-colors duration-300 text-white"
            >
              <i className={`fab fa-${icon} fa-lg`}></i>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto flex flex-wrap justify-center md:justify-start mt-8">
        {[
          { title: "OUR WEBSITE", links: [{ name: "HOME", path: "/User/Home" }, { name: "ABOUT US", path: "/About" }] },
          { title: "CONTACT", links: [{ name: "CONTACT US", path: "/User/Contact" }, { name: "GIVE FEEDBACK", path: "/User/Feedback" }] },
          { title: "MAJOR", links: [{ name: "OUR DUCTS", path: "/major-ducts" }, { name: "MAJOR DUCTS", path: "/major-ducts" }] }
        ].map((section, idx) => (
          <div key={idx} className="lg:w-1/4 md:w-1/2 w-full px-4 mb-4 md:mb-0 text-center md:text-left">
            <h2 className="font-medium tracking-widest text-sm mb-3 text-blue-200">{section.title}</h2>
            <ul className="list-none">
              {section.links.map((link, index) => (
                <li key={index} className="mb-2">
                  <button 
                    onClick={(e) => handleNavigation(e, link.path)} 
                    className="hover:text-blue-200 text-white transition-colors duration-200"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container mx-auto mt-8 pt-4 border-t border-blue-500 text-center text-blue-100 text-sm">
        <p>© {new Date().getFullYear()} The Investigation System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;