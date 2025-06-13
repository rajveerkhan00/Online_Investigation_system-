import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const UserChatComponent = () => {
  const currentUserId = "your-user-id"; // Replace with the actual user ID logic
  const [investigators, setInvestigators] = useState([]);
  const [selectedInvestigatorId, setSelectedInvestigatorId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch Investigators from your MongoDB Atlas backend API
  useEffect(() => {
    const fetchInvestigators = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/investigators');
        setInvestigators(response.data);
      } catch (error) {
        console.error('Error fetching investigators:', error);
      }
    };
    fetchInvestigators();
  }, []);

  // Fetch Messages between currentUserId and selectedInvestigatorId
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentUserId && selectedInvestigatorId) {
        try {
          const { data } = await axios.get(
            `http://localhost:5000/messages?user1=${currentUserId}&user2=${selectedInvestigatorId}`
          );
          setMessages(data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };
    fetchMessages();
  }, [currentUserId, selectedInvestigatorId]);

  // Handle socket connections and receiving messages
  useEffect(() => {
    if (!currentUserId) return;
    socket.emit('joinRoom', { userId: currentUserId });

    const handleReceiveMessage = (message) => {
      if (
        (message.senderId === selectedInvestigatorId && message.receiverId === currentUserId) ||
        (message.senderId === currentUserId && message.receiverId === selectedInvestigatorId)
      ) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => socket.off('receiveMessage', handleReceiveMessage);
  }, [currentUserId, selectedInvestigatorId]);

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = {
      senderId: currentUserId,
      receiverId: selectedInvestigatorId,
      content: input.trim(),
    };
    socket.emit('sendMessage', msg);
    setMessages(prev => [...prev, msg]); // Immediately show the message in the chat box
    setInput('');
  };

  // Render message delivery ticks
  const renderTicks = (msg) => {
    if (msg.senderId !== currentUserId) return null;
    const style = 'ml-2 text-xs';
    if (msg.seen) return <span className={`${style} text-blue-500`}>✔✔</span>;
    if (msg.delivered) return <span className={`${style} text-gray-500`}>✔</span>;
    return <span className={`${style} text-gray-400`}>✔</span>;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg">💬</button>
      )}
      {isOpen && (
        <div className="w-80 h-[28rem] bg-white border rounded-lg shadow-lg flex flex-col relative">
          <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-xl">×</button>

          <div className="mt-8 p-2">
            <select
              value={selectedInvestigatorId}
              onChange={(e) => setSelectedInvestigatorId(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select Investigator</option>
              {investigators.map(inv => (
                <option key={inv._id} value={inv._id}>{inv.name || inv.email}</option>
              ))}
            </select>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((msg, idx) => {
              const isSentByUser = msg.senderId === currentUserId;
              return (
                <div key={idx} className={`flex ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                  {!isSentByUser && (
                    <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center mr-2 text-sm font-semibold">
                      {msg.senderId === selectedInvestigatorId ? 'I' : 'U'}
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[70%] ${
                      isSentByUser
                        ? 'bg-blue-100 text-blue-800 rounded-br-none text-right'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none text-left'
                    }`}
                  >
                    <span className="flex items-center">
                      {msg.content}
                      {renderTicks(msg)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field */}
          <div className="p-2 border-t flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border rounded px-2 py-1"
              placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserChatComponent;
