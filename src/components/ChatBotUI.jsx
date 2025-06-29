import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { FaSun, FaMoon, FaRobot, FaTimes } from 'react-icons/fa';

export default function ChatBotUI() {
  const [darkMode, setDarkMode] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const toggleChatVisibility = () => {
    setIsChatVisible(prev => !prev);
  };

  // Tooltip logic: show every 3 seconds and hide after 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 1500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {showTooltip && !isChatVisible && (
          <div
            className="absolute bottom-16 text-gray-600 text-sm sm:text-base font-semibold 
                       animate-bounce-fade transition-opacity duration-500"
            style={{
              textShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
          >
            Ask Anything...
          </div>
        )}

        <button
          onClick={toggleChatVisibility}
          className={`
            w-14 h-14 sm:w-16 sm:h-16 rounded-full
            flex items-center justify-center
            shadow-lg
            bg-gray-600 hover:bg-gray-700
            transition-colors duration-200
          `}
        >
          {isChatVisible ? (
            <FaTimes className="text-white text-xl sm:text-2xl" />
          ) : (
            <FaRobot className="text-white text-xl sm:text-2xl" />
          )}
        </button>
      </div>

      {/* Chat Interface */}
      {isChatVisible && (
        <div
          className={`
            fixed bottom-20 right-4
            w-[95%] max-w-sm
            h-[75vh] max-h-[600px]
            rounded-t-xl overflow-hidden
            flex flex-col
            shadow-2xl
            z-40
            ${darkMode ? 'bg-gray-800' : 'bg-white'}
            transition-all duration-300
            sm:right-6 sm:bottom-24
          `}
        >
          {/* Header */}
          <div
            className={`
              flex items-center justify-between
              px-4 py-3
              ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}
            `}
          >
            <div className="flex items-center">
              <h1 className="font-medium text-sm"><b>Chat A.I+</b></h1>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <FaSun className="text-yellow-400" />
              ) : (
                <FaMoon className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Chat window */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow darkMode={darkMode} />
          </div>
        </div>
      )}

      {/* Tooltip animation style */}
      <style>
        {`
          @keyframes bounce-fade {
            0%, 100% { transform: translateY(0); opacity: 0; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
          .animate-bounce-fade {
            animation: bounce-fade 1.5s ease-in-out;
          }
        `}
      </style>
    </>
  );
}
