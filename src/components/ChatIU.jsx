import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const InvestigatorChatComponent = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch users who messaged this investigator
  useEffect(() => {
    const fetchSenders = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/investigators/users`);
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchSenders();
  }, []);

  // Fetch messages between investigator and selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUserId) {
        try {
          const { data } = await axios.get(
            `http://localhost:5000/api/messages?user1=${selectedUserId}`
          );
          setMessages(data);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      }
    };
    fetchMessages();
  }, [selectedUserId]);

  // Listen for incoming messages
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (message.receiverId === selectedUserId || message.senderId === selectedUserId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => socket.off('receiveMessage', handleReceiveMessage);
  }, [selectedUserId]);

  // Send message
  const sendMessage = () => {
    if (!input.trim() || !selectedUserId) return;
    const message = {
      senderId: selectedUserId, // You might need to change this logic depending on your implementation
      receiverId: selectedUserId,
      content: input.trim(),
    };
    socket.emit('sendMessage', message);
    setMessages((prev) => [...prev, { ...message, timestamp: new Date() }]);
    setInput('');
  };

  // Message Tick (optional – can be enhanced later)
  const renderTicks = (msg) => {
    const style = 'ml-2 text-xs';
    if (msg.seen) return <span className={`${style} text-blue-500`}>✔✔</span>;
    if (msg.delivered) return <span className={`${style} text-gray-500`}>✔</span>;
    return <span className={`${style} text-gray-400`}>✔</span>;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white w-14 h-14 rounded-full shadow-lg"
        >
          🕵️
        </button>
      ) : (
        <div className="w-80 h-[28rem] bg-white border rounded-lg shadow-lg flex flex-col">
          <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-xl">
            ×
          </button>

          {/* User dropdown */}
          <div className="mt-8 p-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name} ({user.unreadCount} unread)
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2">
            {messages.map((msg, idx) => {
              const isInvestigator = msg.senderId === selectedUserId;
              return (
                <div key={idx} className={`mb-2 flex ${isInvestigator ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[70%] ${
                      isInvestigator ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
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
          </div>

          {/* Input */}
          <div className="p-2 border-t flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border rounded px-2 py-1"
              placeholder="Reply to message..."
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-green-600 text-white px-3 py-1 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigatorChatComponent;
