import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase'; // adjust the path as needed
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserInvestigatorNotifications = () => {
  const [investigatorMessages, setInvestigatorMessages] = useState([]);
  const [investigatorNames, setInvestigatorNames] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'chatsU'),
      where('receiverId', '==', userId),
      where('senderType', '==', 'investigator'),
      where('read', '==', false)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvestigatorMessages(messages);

      // Get unique investigator UIDs from messages
      const senderIds = [...new Set(messages.map((m) => m.senderId))];

      if (senderIds.length > 0) {
        const investigatorsQuery = query(
          collection(db, 'investigatordata'),
          where('uid', 'in', senderIds)
        );

        const investigatorsSnapshot = await getDocs(investigatorsQuery);
        const nameMap = {};

        investigatorsSnapshot.forEach((doc) => {
          const data = doc.data();
          nameMap[data.uid] = data.realName || data.username || 'Investigator';
        });

        setInvestigatorNames(nameMap);
      }
    });

    return () => unsub();
  }, []);

  const handleOpenChat = async (msg) => {
    await updateDoc(doc(db, 'chatsU', msg.id), { read: true });
    setInvestigatorMessages((prev) => prev.filter((m) => m.id !== msg.id));
    navigate('/User/Chat');
  };

  return (
 <div className="fixed right-6 top-[175px] z-50">
  {/* Bell Icon */}
  <button
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="relative p-2 rounded-full bg-gray-100 border border-gray-300 text-gray-600 hover:text-gray-800 hover:scale-105 transition-all duration-200"
  >
    <Bell size={24} />
    {investigatorMessages.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow">
        {investigatorMessages.length > 9 ? '9+' : investigatorMessages.length}
      </span>
    )}
  </button>

  {/* Dropdown */}
  {isDropdownOpen && (
    <div className="absolute right-0 mt-3 w-80 bg-gray-50 border border-gray-300 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto animate-fade-in">
      {investigatorMessages.length === 0 ? (
        <div className="p-5 text-gray-500 text-sm text-center">
          No new messages from investigators.
        </div>
      ) : (
        investigatorMessages.map((msg, idx) => (
          <div
            key={idx}
            className="p-4 border-b border-gray-200 hover:bg-gray-100 transition-all duration-150"
          >
            <p className="text-sm font-semibold text-gray-700">
              From: {investigatorNames[msg.senderId] || 'Investigator'}
            </p>
            <p className="text-gray-600 mt-1">{msg.text}</p>
            <p className="text-xs text-gray-400 mt-1">
              {msg.timestamp?.toDate().toLocaleString() || 'No timestamp'}
            </p>
            <button
              onClick={() => handleOpenChat(msg)}
              className="mt-2 text-sm text-gray-700 font-medium hover:text-gray-900 hover:underline transition-all"
            >
              Open in chat below
            </button>
          </div>
        ))
      )}
    </div>
  )}
</div>

  );
};

export default UserInvestigatorNotifications;
