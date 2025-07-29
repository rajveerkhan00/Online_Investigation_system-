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
import { auth, db } from '../firebase';
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
        className="relative p-3 rounded-full bg-gradient-to-br from-red-100 to-gray-200 border border-red-200 text-gray-700 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
        aria-label="Show investigator notifications"
      >
        <Bell size={26} className="drop-shadow" />
        {investigatorMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-br from-pink-500 to-red-600 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white font-bold animate-bounce">
            {investigatorMessages.length > 9 ? '9+' : investigatorMessages.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white/95 border border-blue-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto animate-fade-in backdrop-blur-lg">
          <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-blue-100">
            <Bell size={20} className="text-blue-500" />
            <span className="font-semibold text-blue-700 text-lg tracking-wide">
              Investigator Notifications
            </span>
          </div>
          {investigatorMessages.length === 0 ? (
            <div className="p-8 text-gray-400 text-base text-center font-medium">
              No new messages from investigators.
            </div>
          ) : (
            investigatorMessages.map((msg, idx) => (
              <div
                key={idx}
                className="p-5 border-b border-blue-100 hover:bg-blue-50/60 transition-all duration-150 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold shadow">
                    {investigatorNames[msg.senderId]?.charAt(0).toUpperCase() || 'I'}
                  </span>
                  <span className="text-base font-semibold text-blue-700">
                    {investigatorNames[msg.senderId] || 'Investigator'}
                  </span>
                </div>
                <p className="text-gray-700 mt-1 text-sm">{msg.text}</p>
                <p className="text-xs text-gray-400 mt-1 italic">
                  {msg.timestamp?.toDate().toLocaleString() || 'No timestamp'}
                </p>
                <button
                  onClick={() => handleOpenChat(msg)}
                  className="mt-2 self-end text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1.5 rounded-full shadow hover:from-blue-600 hover:to-purple-600 hover:scale-105 transition-all font-semibold"
                >
                  Open in Chat
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