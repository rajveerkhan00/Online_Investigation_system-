import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import Headeri from "../components/Headeri";
import Footer from "../components/Footeri";
import Navbari from "../components/Navbari";
import { collection, query, where, getDocs, doc, setDoc, addDoc, serverTimestamp, onSnapshot, orderBy, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InvestigatorChat = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [showChatList, setShowChatList] = useState(true); // For mobile toggle
  const messagesEndRef = useRef(null);

  // Fetch all active chats for this investigator and user data
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchActiveChatsAndUserData = async () => {
      try {
        // Fetch active chats
        const chatsQuery = query(collection(db, 'chats'), where('investigatorId', '==', auth.currentUser.uid));
        const chatsSnapshot = await getDocs(chatsQuery);
        const chatsList = chatsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch user data (username and email)
        const userIds = chatsList.map(chat => chat.userId);
        const userDataMap = {};
        
        for (const userId of userIds) {
          try {
            const userQuery = query(collection(db, 'usersdata'), where('uid', '==', userId));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userDoc  = userSnapshot.docs[0].data();
              userDataMap[userId] = {
                username: userDoc.username || `User (${userId.slice(0, 4)})`,
                email: userDoc.email || 'No email'
              };
            } else {
              userDataMap[userId] = {
                username: `User (${userId.slice(0, 4)})`,
                email: 'No email'
              };
            }
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            userDataMap[userId] = {
              username: `User (${userId.slice(0, 4)})`,
              email: 'Error loading email'
            };
          }
        }

        setUserData(userDataMap);
        setActiveChats(chatsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error('Failed to load chats');
        setLoading(false);
      }
    };

    fetchActiveChatsAndUserData();
  }, [auth.currentUser]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(loadedMessages);

      // Mark user messages as read
      const unreadMessages = loadedMessages.filter(
        msg => msg.senderType === 'user' && !msg.read
      );

      if (unreadMessages.length > 0) {
        const batch = [];
        unreadMessages.forEach(msg => {
          const messageRef = doc(db, 'chats', selectedChat.id, 'messages', msg.id);
          batch.push(updateDoc(messageRef, { read: true }));
        });

        try {
          await Promise.all(batch);
        } catch (error) {
          console.error('Error updating read status:', error);
          toast.error('Failed to mark messages as read');
        }
      }

      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !auth.currentUser) return;

    const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
    const chatsURef = collection(db, 'chatsU');

    try {
      // Update chat timestamp
      await setDoc(doc(db, 'chats', selectedChat.id), {
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Add new message to chats/{chatId}/messages
      const newMessageData = {
        senderId: auth.currentUser.uid,
        senderType: 'investigator',
        content: newMessage,
        timestamp: serverTimestamp(),
        read: true
      };
      
      await addDoc(messagesRef, newMessageData);

      // Also store the message in chatsU collection with the specified format
      await addDoc(chatsURef, {
        text: newMessage,
        senderType: 'investigator',
        senderId: auth.currentUser.uid,
        receiverId: selectedChat.userId,
        read: false, // This will be unread by user
        timestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Headeri />
      <Navbari />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-gray-100 mt-2 mb-20">
        {/* Mobile Chat List Toggle Button */}
        <button 
          onClick={() => setShowChatList(!showChatList)}
          className="md:hidden p-2 bg-gray-200 text-gray-700 flex items-center justify-center"
        >
          {showChatList ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Hide Chats
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Show Chats
            </>
          )}
        </button>

        {/* Chat List */}
        <div className={`${showChatList ? 'block' : 'hidden'} md:block w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200`}>
          <div className="p-4 bg-gray-500 text-white">
            <h2 className="text-xl font-semibold">Your Active Chats</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {activeChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No active chats yet
              </div>
            ) : (
              activeChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat);
                    if (window.innerWidth < 768) {
                      setShowChatList(false);
                    }
                  }}
                  className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-100 flex items-center justify-center text-indigo-600 font-semibold">
                      {userData[chat.userId]?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <p className="font-bold text-sm md:text-lg text-gray-900 truncate">
                        {userData[chat.userId]?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 font-light truncate">
                        {userData[chat.userId]?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {chat.updatedAt?.toDate().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {messages.some(
                    m => m.senderType === 'user' && !m.read && selectedChat?.id === chat.id
                  ) && (
                    <div className="mt-1 flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-indigo-800">
                        New
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!showChatList || selectedChat ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
          {selectedChat ? (
            <>
              {/* Chat Header with back button for mobile */}
              <div className="p-3 bg-white border-b border-gray-200 flex items-center">
                <button 
                  onClick={() => setShowChatList(true)}
                  className="md:hidden mr-2 text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {userData[selectedChat.userId]?.username?.charAt(0) || 'U'}
                </div>
                <div className="ml-3 overflow-hidden">
                  <h3 className="font-bold text-sm md:text-lg text-gray-900 truncate">
                    {userData[selectedChat.userId]?.username || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500 font-light truncate">
                    {userData[selectedChat.userId]?.email}
                  </p>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No messages in this chat
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start the conversation with {userData[selectedChat.userId]?.username || 'the user'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderType === 'investigator' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] md:max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.senderType === 'investigator'
                              ? 'bg-gray-600 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none shadow'
                          } ${
                            message.senderType === 'user' && !message.read
                              ? 'ring-1 ring-indigo-300'
                              : ''
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderType === 'investigator'
                                ? 'text-indigo-200'
                                : 'text-gray-500'
                            }`}
                          >
                            {message.timestamp?.toDate().toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {message.senderType === 'user' && !message.read && (
                              <span className="ml-1 text-indigo-500">• Unread</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-l-full focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-gray-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`px-3 py-2 rounded-r-full ${
                      newMessage.trim()
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No chat selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a chat from the list to view messages
                </p>
                <button
                  onClick={() => setShowChatList(true)}
                  className="mt-4 md:hidden px-4 py-2 bg-gray-600 text-white rounded-lg"
                >
                  Show Chat List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default InvestigatorChat;