import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import {
  collection, query, where, onSnapshot,
  getDocs, updateDoc, doc, addDoc
} from 'firebase/firestore';
import { BellIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const InvestigatorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [caseNotifications, setCaseNotifications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const processedCases = useRef(new Set());
  const escalationTimers = useRef({});
  const lastMessageIds = useRef(new Set());
  const processedNotifications = useRef(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    const casesQ = query(
      collection(db, 'firs'),
      where('assignedInvestigator', '==', auth.currentUser.uid),
      where('status', '==', 'Pending')
    );

    const unsubCases = onSnapshot(casesQ, snap => {
      snap.docChanges().forEach(change => {
        const caseId = change.doc.id;
        if (change.type === 'added' && !processedCases.current.has(caseId)) {
          processedCases.current.add(caseId);

          const newNotif = {
            id: caseId,
            type: 'case',
            text: 'New case assigned to you! Respond quickly!',
            timestamp: new Date(),
            read: false,
            caseId: caseId
          };

          setCaseNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(c => c + 1);
          triggerBell();
          toast.info(newNotif.text, {
            position: 'top-right',
            autoClose: 5000,
            style: { backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444' }
          });

          startEscalationTimers(caseId, change.doc.data().userName || 'Unknown User');
        }
      });
    });

    const chatsQ = query(
      collection(db, 'chats'),
      where('investigatorId', '==', auth.currentUser.uid)
    );

    const unsubChats = onSnapshot(chatsQ, async snap => {
      const newMessages = [];
      for (const chatDoc of snap.docs) {
        const msgsQ = query(
          collection(db, 'chats', chatDoc.id, 'messages'),
          where('read', '==', false),
          where('senderType', '==', 'user')
        );
        const msgsSnap = await getDocs(msgsQ);

        msgsSnap.forEach(msgDoc => {
          const mid = msgDoc.id;
          if (!lastMessageIds.current.has(mid)) {
            lastMessageIds.current.add(mid);
            newMessages.push({
              id: mid,
              chatId: chatDoc.id,
              text: msgDoc.data().content || 'New message',
              timestamp: msgDoc.data().timestamp?.toDate() || new Date(),
              senderName: msgDoc.data().senderName || 'User',
              type: 'message',
              read: false
            });
          }
        });
      }

      if (newMessages.length) {
        setNotifications(prev => [...newMessages, ...prev].sort((a, b) => b.timestamp - a.timestamp));
        setUnreadCount(c => c + newMessages.length);
        triggerBell();
      }

      setLoading(false);
    });

    const adminAlertsQ = query(
      collection(db, 'adminalerts'),
      where('investigatorId', '==', auth.currentUser.uid),
      where('status', '==', 'unread')
    );

    const unsubAdmin = onSnapshot(adminAlertsQ, snapshot => {
      const newAdminNotifs = [];

      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && !processedNotifications.current.has(change.doc.id)) {
          processedNotifications.current.add(change.doc.id);
          const data = change.doc.data();
          newAdminNotifs.push({
            id: change.doc.id,
            type: 'admin',
            text: data.message || 'Important alert from admin!',
            timestamp: data.createdAt?.toDate() || new Date(),
            read: false
          });
        }
      });

      if (newAdminNotifs.length) {
        setAdminNotifications(prev => [...newAdminNotifs, ...prev]);
        setUnreadCount(c => c + newAdminNotifs.length);
        triggerBell();
      }
    });

    return () => {
      unsubCases();
      unsubChats();
      unsubAdmin();
      // Clear timers
      Object.values(escalationTimers.current).forEach(t => {
        clearTimeout(t.warning);
        clearTimeout(t.final);
      });
    };
  }, []);

  const startEscalationTimers = (caseId, username) => {
    const investigatorId = auth.currentUser.uid;

    const warning = setTimeout(() => {
      toast.warn("Review the case quickly otherwise strict action is taken", {
        position: 'top-right',
        autoClose: 5000
      });
    }, 24 * 60 * 60 * 1000);

    const final = setTimeout(async () => {
      toast.error("Review otherwise the notification will be sent to admin", {
        position: 'top-right',
        autoClose: 5000
      });

      try {
        await addDoc(collection(db, 'Adminwindowalerts'), {
          firid: caseId,
          username,
          investigatorid: investigatorId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Failed to send admin escalation:", error);
      }
    }, 24 * 60 * 60 * 1000);

    escalationTimers.current[caseId] = { warning, final };
  };

  const triggerBell = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 1000);
  };

  const markAsRead = async (notif) => {
    try {
      if (notif.type === 'message') {
        await updateDoc(doc(db, 'chats', notif.chatId, 'messages', notif.id), { read: true });
        setNotifications(n => n.filter(x => x.id !== notif.id));
      } else if (notif.type === 'admin') {
        await updateDoc(doc(db, 'adminalerts', notif.id), { read: true, status: 'read' });
        setAdminNotifications(n => n.filter(x => x.id !== notif.id));
      } else {
        setCaseNotifications(n => n.filter(x => x.id !== notif.id));
      }
      setUnreadCount(c => c - 1);
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const msgUpdates = notifications.map(n =>
        updateDoc(doc(db, 'chats', n.chatId, 'messages', n.id), { read: true })
      );
      const alertUpdates = adminNotifications.map(n =>
        updateDoc(doc(db, 'adminalerts', n.id), { read: true, status: 'read' })
      );
      await Promise.all([...msgUpdates, ...alertUpdates]);

      setNotifications([]);
      setCaseNotifications([]);
      setAdminNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewAllChats = () => {
    navigate('/investigator/Chat');
    setIsOpen(false);
  };

  const allNotifs = [...caseNotifications, ...notifications, ...adminNotifications].sort((a, b) => b.timestamp - a.timestamp);

  if (loading) {
    return <div className="flex items-center justify-center p-2">Loading...</div>;
  }

  return (
    <div className="fixed right-4 top-32 z-50">
      {/* Notification Bell Button */}
      <motion.button
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 rounded-full border border-gray-200 h-10 w-10 flex items-center justify-center bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: isRinging ? [0, -15, 15, -15, 15, 0] : 0,
          scale: isRinging ? [1, 1.1, 1] : 1
        }}
        transition={{ 
          rotate: { 
            type: 'keyframes',
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            duration: 0.6 
          },
          scale: { duration: 0.3 }
        }}
      >
        <BellIcon className="h-5 w-5 text-gray-500 group-hover:text-indigo-500 transition-colors duration-200" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          >
            {/* Panel Header */}
            <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-medium text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {allNotifs.length ? (
                allNotifs.map(n => (
                  <motion.div
                    key={`${n.id}-${n.timestamp.valueOf()}`}
                    onClick={() => n.type === 'case' ? null : markAsRead(n)}
                    className={`p-3 border-b border-gray-100 cursor-pointer transition-colors duration-100 hover:bg-opacity-80 ${
                      n.read 
                        ? 'bg-white' 
                        : n.type === 'case'
                          ? 'bg-blue-50' 
                          : n.type === 'admin'
                            ? 'bg-purple-50'
                            : 'bg-green-50'
                    }`}
                    whileHover={{ scale: 1.005 }}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm flex items-center gap-1 ${
                        n.read ? 'text-gray-600' : 'font-medium text-gray-900'
                      }`}>
                        {/* Notification type indicator */}
                        {n.type === 'case' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                        {n.type === 'admin' && (
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        )}
                        {n.type !== 'case' && n.type !== 'admin' && (
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        )}
                        {n.type === 'case' 
                          ? 'New Case' 
                          : n.type === 'admin' 
                            ? 'Admin Alert' 
                            : n.senderName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${n.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {n.text}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <div className="inline-block p-3 rounded-full bg-gray-100 mb-2">
                    <BellIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">You're all caught up!</p>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
              <button 
                onClick={handleViewAllChats} 
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
              >
                View all chats
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestigatorNotifications;