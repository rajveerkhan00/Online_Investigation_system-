import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-500 py-8 px-4 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Brand and Description */}
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h3 className="text-xl font-bold">The Investigation System</h3>
          <p className="text-sm">Report anything here</p>
        </div>

        {/* Social Media Links */}
        <div className="flex space-x-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-gray-300 transition-colors duration-300">
            <i className="fab fa-facebook-f fa-lg"></i>
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors duration-300">
            <i className="fab fa-twitter fa-lg"></i>
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors duration-300">
            <i className="fab fa-linkedin-in fa-lg"></i>
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors duration-300">
            <i className="fab fa-instagram fa-lg"></i>
          </a>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="container mx-auto flex flex-wrap justify-center md:justify-start mt-8">
        {/* Section 1 */}
        <div className="lg:w-1/4 md:w-1/2 w-full px-4 mb-4 md:mb-0 text-center md:text-left">
          <h2 className="font-medium tracking-widest text-sm mb-3">OUR WEBSITE</h2>
          <ul className="list-none">
            <li>
              <a href="index.html" className="hover:text-gray-300">HOME</a>
            </li>
            <li>
              <a href="aboutus.html" className="hover:text-gray-300">ABOUT US</a>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="lg:w-1/4 md:w-1/2 w-full px-4 mb-4 md:mb-0 text-center md:text-left">
          <h2 className="font-medium tracking-widest text-sm mb-3">CONTACT</h2>
          <ul className="list-none">
            <li>
              <a href="contactus.html" className="hover:text-gray-300">CONTACT US</a>
            </li>
            <li>
              <a href="feedback.html" className="hover:text-gray-300">GIVE FEEDBACK</a>
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="lg:w-1/4 md:w-1/2 w-full px-4 mb-4 md:mb-0 text-center md:text-left">
          <h2 className="font-medium tracking-widest text-sm mb-3">MAJOR</h2>
          <ul className="list-none">
            <li>
              <a href="index.html" className="hover:text-gray-300">OUR DUCTS</a>
            </li>
            <li>
              <a href="index.html" className="hover:text-gray-300">MAJOR DUCTS</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
