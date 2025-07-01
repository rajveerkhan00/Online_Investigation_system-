// src/hooks/useAuthTimeout.js
import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const useAuthTimeout = (timeoutMinutes = 5) => {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'mousedown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check inactivity every 30 seconds
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const inactiveTime = (currentTime - lastActivity) / (1000 * 60); // in minutes

      if (inactiveTime >= timeoutMinutes && auth.currentUser) {
        auth.signOut();
        navigate('/user/login');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [lastActivity, navigate, timeoutMinutes]);

  return { lastActivity, setLastActivity };
};

export default useAuthTimeout;