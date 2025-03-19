import React from "react";
import { auth } from "../firebase"; // Ensure Firebase is correctly imported
import { Link } from "react-router-dom"; // Import Link for navigation

const Footer = () => {
  const currentUser = auth.currentUser; // Get the currently logged-in user

  if (!currentUser) {
    alert("Please login/signup first to access this feature.");
    return null; // Don't render the footer if no user is logged in
  }

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
              <Link to="/User/Home" className="text-gray-700 hover:text-gray-800">
                HOME
              </Link>
            </li>
            <li>
              <Link to="/About" className="text-gray-700 hover:text-gray-800">
                ABOUT US
              </Link>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="w-1/2 md:w-1/4 px-2 mb-4 text-center md:text-left">
          <h2 className="font-medium text-gray-900 text-sm mb-2">CONTACT</h2>
          <ul>
            <li>
              <Link to="/User/Contact" className="text-gray-700 hover:text-gray-800">
                CONTACT US
              </Link>
            </li>
            <li>
              <Link to="/User/Feedback" className="text-gray-700 hover:text-gray-800">
                GIVE FEEDBACK
              </Link>
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="w-1/2 md:w-1/4 px-2 mb-4 text-center md:text-left">
          <h2 className="font-medium text-gray-900 text-sm mb-2">MAJOR</h2>
          <ul>
            <li>
              <Link to="#" className="text-gray-700 hover:text-gray-800">
                OUR DUCTS
              </Link>
            </li>
            <li>
              <Link to="#" className="text-gray-700 hover:text-gray-800">
                MAJOR DUCTS
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
