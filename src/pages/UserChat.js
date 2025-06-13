import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const UserChat = () => {
  const [investigators, setInvestigators] = useState([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch all investigators
  useEffect(() => {
    const fetchInvestigators = async () => {
      try {
        const q = query(collection(db, 'investigatordata'));
        const querySnapshot = await getDocs(q);
        const investigatorsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvestigators(investigatorsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching investigators:', error);
        setLoading(false);
      }
    };

    fetchInvestigators();
  }, []);

  // Load messages when an investigator is selected
  useEffect(() => {
    if (!selectedInvestigator || !auth.currentUser) return;

    const chatId = `${auth.currentUser.uid}_${selectedInvestigator.id}`;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(loadedMessages);
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedInvestigator]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedInvestigator || !auth.currentUser) return;

    const chatId = `${auth.currentUser.uid}_${selectedInvestigator.id}`;
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    try {
      // Create or update chat document
      await setDoc(chatRef, {
        userId: auth.currentUser.uid,
        investigatorId: selectedInvestigator.id,
        userName: auth.currentUser.displayName || 'User',
        investigatorName: selectedInvestigator.username || 'Investigator', // Changed from name to username
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      // Add new message
      await addDoc(messagesRef, {
        senderId: auth.currentUser.uid,
        senderType: 'user',
        content: newMessage,
        timestamp: serverTimestamp(),
        read: false
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
    <Header />
       <Navbar />
    <div className="flex h-screen bg-gray-100 mt-2 mb-20">
      {/* Investigators List */}
      <div className="w-1/4 bg-white border-r border-gray-200">
        <div className="p-4 bg-gray-500 text-white">
          <h2 className="text-xl font-semibold">Select an Investigator</h2>
        </div>
        <div className="overflow-y-auto h-full">
          {investigators.map(investigator => (
            <div
              key={investigator.id}
              onClick={() => setSelectedInvestigator(investigator)}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedInvestigator?.id === investigator.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {investigator.username?.charAt(0) || investigator.email?.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-bold text-lg text-gray-900">
                    {investigator.username}
                  </p>
                  <p className="text-xs text-gray-500 font-light">
                    {investigator.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {investigator.specialization || 'Private Investigator'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedInvestigator ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-indigo-600 font-semibold">
                {selectedInvestigator.username?.charAt(0) || selectedInvestigator.email?.charAt(0)}
              </div>
              <div className="ml-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {selectedInvestigator.username}
                </h3>
                <p className="text-xs text-gray-500 font-light">
                  {selectedInvestigator.email}
                </p>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
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
                      No messages yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start the conversation with {selectedInvestigator.username || 'the investigator'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderType === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'user'
                            ? 'bg-gray-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderType === 'user'
                              ? 'text-indigo-200'
                              : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp?.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`px-4 py-2 rounded-r-full ${
                    newMessage.trim()
                      ? 'bg-gray-500 text-white hover:bg-gray-600'
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No investigator selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose an investigator from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
      
    </div>
      <Footer />
    </>
  );
};

export default UserChat;