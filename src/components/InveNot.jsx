import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { BellIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const InvestigatorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [userDataMap, setUserDataMap] = useState({});
  const [caseNotifications, setCaseNotifications] = useState([]);
  const [processedCases, setProcessedCases] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    // Listen for new cases assigned to this investigator
    const casesQuery = query(
      collection(db, 'firs'),
      where('assignedInvestigator', '==', auth.currentUser.uid),
      where('status','==','Pending')
    );

    const unsubscribeCases = onSnapshot(casesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !processedCases.has(change.doc.id)) {
          // Add to processed cases to prevent duplicate notifications
          setProcessedCases(prev => {
            const newSet = new Set(prev);
            newSet.add(change.doc.id);
            return newSet;
          });

          const notification = {
            id: change.doc.id,
            type: 'case',
            text: 'New case assigned to you! Respond quickly!',
            timestamp: new Date(),
            read: false,
            caseId: change.doc.id,
            backgroundColor: 'bg-red-100',
            borderColor: 'border-red-200'
          };
          
          setCaseNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 1000);
          
          toast.info('New case assigned to you!', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            style: { 
              backgroundColor: '#fee2e2', 
              borderLeft: '4px solid #ef4444',
              color: '#b91c1c'
            }
          });
        }
      });
    });

    const fetchUserData = async (userIds) => {
      const userData = {};
      
      for (const userId of userIds) {
        try {
          const userQuery = query(collection(db, 'usersdata'), where('uid', '==', userId));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0].data();
            userData[userId] = {
              username: userDoc.username || `User (${userId.slice(0, 4)})`,
              email: userDoc.email || 'No email'
            };
          } else {
            userData[userId] = {
              username: `User (${userId.slice(0, 4)})`,
              email: 'No email'
            };
          }
        } catch (error) {
          console.error(`Error fetching user data for ${userId}:`, error);
          userData[userId] = {
            username: `User (${userId.slice(0, 4)})`,
            email: 'Error loading email'
          };
        }
      }
      
      setUserDataMap(userData);
    };

    const fetchNotifications = async () => {
      try {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('investigatorId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(chatsQuery, async (chatsSnapshot) => {
          let allNotifications = [];
          let newMessageCount = 0;
          const userIds = new Set();
          
          chatsSnapshot.docs.forEach(chatDoc => {
            if (chatDoc.data().userId) {
              userIds.add(chatDoc.data().userId);
            }
          });

          await fetchUserData(Array.from(userIds));

          for (const chatDoc of chatsSnapshot.docs) {
            const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
            const messagesQuery = query(
              messagesRef,
              where('read', '==', false),
              where('senderType', '==', 'user')
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            
            messagesSnapshot.forEach((messageDoc) => {
              const message = messageDoc.data();
              const userId = chatDoc.data().userId;
              const userData = userDataMap[userId] || {
                username: `User (${userId?.slice(0, 4) || 'unknown'})`
              };
              
              allNotifications.push({
                id: messageDoc.id,
                chatId: chatDoc.id,
                userId: userId,
                text: message.content || 'New message',
                senderName: userData.username,
                timestamp: message.timestamp?.toDate() || new Date(),
                read: false,
                type: 'message',
                backgroundColor: 'bg-white',
                borderColor: 'border-yellow-50'
              });
              newMessageCount++;
            });
          }

          if (newMessageCount > 0 && notifications.length < allNotifications.length) {
            setIsRinging(true);
            setTimeout(() => setIsRinging(false), 1000);
          }

          allNotifications.sort((a, b) => b.timestamp - a.timestamp);
          
          setNotifications(allNotifications);
          setUnreadCount(prev => prev + allNotifications.length);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      unsubscribeCases();
    };
  }, [auth.currentUser, notifications.length, userDataMap, processedCases]);

  const markAsRead = async (notification) => {
    try {
      if (notification.type === 'message') {
        await updateDoc(doc(db, 'chats', notification.chatId, 'messages', notification.id), {
          read: true
        });
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      } else if (notification.type === 'case') {
        setCaseNotifications(prev => prev.filter(n => n.id !== notification.id));
      }
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const batchUpdates = notifications.map(notification => 
        updateDoc(doc(db, 'chats', notification.chatId, 'messages', notification.id), {
          read: true
        })
      );
      await Promise.all(batchUpdates);
      setNotifications([]);
      setCaseNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewAllChats = () => {
    navigate('/investigator/Chat');
    setIsOpen(false);
  };

  const handleViewCase = (caseId) => {
    setIsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const allNotifications = [...caseNotifications, ...notifications].sort((a, b) => b.timestamp - a.timestamp);

return (
    <div className="fixed right-4 top-[125px] z-50">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background:rgb(74, 75, 75);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background:rgb(42, 43, 43);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
      
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-70 shadow-lg"
        aria-label="Notifications"
        animate={{
          rotate: isRinging ? [0, -15, 15, -15, 15, 0] : 0,
          scale: isRinging ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <BellIcon className={`h-7 w-7 ${isRinging ? 'text-gray-700' : 'text-gray-600'}`} />
        {unreadCount > 0 && (
          <motion.span 
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gray-700 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {allNotifications.length > 0 ? (
                allNotifications.map((notification) => (
                  <motion.div 
                    key={`${notification.id}-${notification.timestamp.getTime()}`}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${notification.read ? 'bg-white' : 'bg-gray-50'}`}
                    onClick={() => notification.type === 'case' ? handleViewCase(notification.caseId) : markAsRead(notification)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-800 truncate max-w-[70%]">
                        {notification.type === 'case' ? 'New Case' : notification.senderName}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {notification.text}
                    </p>
                    {!notification.read && (
                      <div className="mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1"></span>
                        <span className="text-xs text-gray-600">New</span>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="p-6 text-center text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <BellIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600">No new notifications</h4>
                  <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                </motion.div>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-center">
              <button
                onClick={handleViewAllChats}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors w-full"
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