import React, { useState, useEffect, useRef } from "react";
import { FaCommentDots, FaPaperPlane, FaTimes } from "react-icons/fa";

const crimeData = {
    "treason": {
      description: "Trying to overthrow the government or harm the country.",
      punishment: "Death penalty or life imprisonment.",
      section: "Section 124A, PPC"
    },
    "terrorism": {
      description: "Acts causing fear, violence, or destruction.",
      punishment: "Death penalty, life imprisonment, or heavy fines.",
      section: "Anti-Terrorism Act, 1997"
    },
    "murder": {
      description: "Killing someone on purpose.",
      punishment: "Death penalty or life imprisonment.",
      section: "Section 302, PPC"
    },
    "manslaughter": {
      description: "Killing someone by accident.",
      punishment: "Up to 10 years in prison and fine (Diyat).",
      section: "Section 319, PPC"
    },
    "attempted murder": {
      description: "Trying to kill someone but failing.",
      punishment: "Up to 10 years in prison and fine.",
      section: "Section 324, PPC"
    },
    "kidnapping": {
      description: "Taking someone by force or trickery.",
      punishment: "7 years to life imprisonment.",
      section: "Sections 359-374, PPC"
    },
    "human trafficking": {
      description: "Smuggling or selling people.",
      punishment: "Up to 10 years in prison and heavy fines.",
      section: "Prevention of Trafficking in Persons Act, 2018"
    },
    "rape": {
      description: "Non-consensual sexual activity.",
      punishment: "Death penalty or life imprisonment.",
      section: "Sections 375 & 376, PPC"
    },
    "sexual harassment": {
      description: "Unwanted sexual comments or actions.",
      punishment: "Up to 3 years in prison and fine.",
      section: "Section 509, PPC"
    },
    "child sexual abuse": {
      description: "Any sexual act against a child.",
      punishment: "10 years to life imprisonment.",
      section: "Zainab Alert Act, 2020"
    },
    "theft": {
      description: "Taking something without permission.",
      punishment: "Up to 3 years in prison and fine.",
      section: "Section 378, PPC"
    },
    "robbery": {
      description: "Stealing with violence or threats.",
      punishment: "3 to 10 years in prison.",
      section: "Section 392, PPC"
    },
    "dacoity": {
      description: "A group committing robbery.",
      punishment: "Death penalty or life imprisonment.",
      section: "Section 391, PPC"
    },
    "fraud": {
      description: "Cheating someone for money or property.",
      punishment: "Up to 7 years in prison and fine.",
      section: "Section 415, PPC"
    },
    "cyber terrorism": {
      description: "Using the internet to spread fear or harm.",
      punishment: "Up to 14 years in prison and fine.",
      section: "Prevention of Electronic Crimes Act, 2016"
    },
    "online harassment": {
      description: "Sending threats or unwanted messages online.",
      punishment: "Up to 3 years in prison and fine.",
      section: "Prevention of Electronic Crimes Act, 2016"
    },
    "identity theft": {
      description: "Stealing someone’s personal information online.",
      punishment: "Up to 7 years in prison and fine.",
      section: "Prevention of Electronic Crimes Act, 2016"
    },
    "money laundering": {
      description: "Hiding illegal money.",
      punishment: "Up to 10 years in prison and fine.",
      section: "Anti-Money Laundering Act, 2010"
    },
    "tax evasion": {
      description: "Avoiding paying legal taxes.",
      punishment: "Heavy fines and up to 7 years in prison.",
      section: "Income Tax Ordinance, 2001"
    },
    "counterfeiting currency": {
      description: "Making or using fake money.",
      punishment: "Life imprisonment.",
      section: "Section 489A, PPC"
    },
    "corruption and bribery": {
      description: "Giving or taking bribes for unfair advantages.",
      punishment: "14 years in prison and fine.",
      section: "National Accountability Ordinance, 1999"
    },
    "drug trafficking": {
      description: "Selling or transporting drugs.",
      punishment: "Death penalty or life imprisonment.",
      section: "Control of Narcotic Substances Act, 1997"
    },
    "possession of illegal drugs": {
      description: "Keeping drugs for personal use.",
      punishment: "2 to 7 years in prison.",
      section: "Control of Narcotic Substances Act, 1997"
    },
    "blasphemy": {
      description: "Insulting religious beliefs or figures.",
      punishment: "Death penalty or life imprisonment.",
      section: "Sections 295-298, PPC"
    },
    "defiling places of worship": {
      description: "Damaging mosques, churches, or temples.",
      punishment: "Up to 10 years in prison.",
      section: "Section 295, PPC"
    },
    "domestic violence": {
      description: "Physical or emotional abuse at home.",
      punishment: "Up to 3 years in prison and fine.",
      section: "Domestic Violence Act, 2020"
    },
    "forced marriage": {
      description: "Marrying someone against their will.",
      punishment: "Up to 7 years in prison.",
      section: "Section 498-B, PPC"
    },
    "child marriage": {
      description: "Marrying a person below the legal age.",
      punishment: "Up to 3 years in prison and fine.",
      section: "Child Marriage Restraint Act, 1929"
    },
    "honor killing": {
      description: "Killing a family member for so-called honor.",
      punishment: "Death penalty or life imprisonment.",
      section: "Section 311, PPC"
    },
    "illegal logging": {
      description: "Cutting trees without permission.",
      punishment: "Heavy fines and imprisonment.",
      section: "Forest Act, 1927"
    },
    "pollution violations": {
      description: "Dumping waste illegally.",
      punishment: "Heavy fines.",
      section: "Pakistan Environmental Protection Act, 1997"
    },
    "selling adulterated food": {
      description: "Selling fake or unsafe food.",
      punishment: "Up to 3 years in prison and fine.",
      section: "Pure Food Ordinance, 1960"
    },
    "defamation": {
      description: "Spreading false information about someone.",
      punishment: "Up to 2 years in prison and fine.",
      section: "Section 499, PPC"
    },
    "public nuisance": {
      description: "Disturbing public peace (loud noise, blocking roads, etc.).",
      punishment: "Fine or short-term imprisonment.",
      section: "Section 268, PPC"
    },
    "animal cruelty": {
      description: "Harming animals.",
      punishment: "Fine and up to 6 months in prison.",
      section: "Prevention of Cruelty to Animals Act, 1890"
    }
  };
  
const CrimeChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "👋 Hello! Ask me about any crime in Pakistan.", sender: "bot" }]);
  const [userInput, setUserInput] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleUserInput = () => {
    if (!userInput.trim()) return;

    const lowerCaseInput = userInput.toLowerCase();
    const foundCrime = Object.keys(crimeData).find(crime => lowerCaseInput.includes(crime));

    const newMessages = [...messages, { text: userInput, sender: "user" }];

    if (foundCrime) {
      const crimeInfo = crimeData[foundCrime];
      newMessages.push({
        text: `📌 **${foundCrime.toUpperCase()}**\n\n📝 **Description:** ${crimeInfo.description}\n⚖️ **Punishment:** ${crimeInfo.punishment}\n📜 **Law Section:** ${crimeInfo.section}`,
        sender: "bot"
      });
    } else {
      newMessages.push({ text: "⚠️ Sorry, I don't have information on that crime. Try asking about 'murder' or 'theft'.", sender: "bot" });
    }

    setMessages(newMessages);
    setUserInput("");
  };

  return (    
  <div className="fixed bottom-5 right-5 z-50">
    {/* Floating Button */}
    <button
      className="bg-gray-600 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition"
      onClick={() => setIsOpen(!isOpen)}
    >
      {isOpen ? <FaTimes size={24} /> : <FaCommentDots size={24} />}
    </button>

    {/* Chatbot Window */}
    {isOpen && (
      <div className="w-80 bg-gray-900 text-white shadow-xl fixed bottom-16 right-5 rounded-t-xl rounded-b-lg transform">
        {/* Header */}
        <div className="bg-gray-900 p-3 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-lg font-semibold">⚖️ Pakistan Crime Chatbot</h2>
          <button onClick={() => setIsOpen(false)} className="text-white">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div
          className="h-80 overflow-y-auto p-4 flex flex-col space-y-3 bg-gray-800 rounded-b-3xl pb-5"
          ref={chatContainerRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-3/4 px-3 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-gray-300 text-black self-end"
                  : "bg-gray-700 text-gray-300 self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="flex items-center p-3 bg-gray-900 border-t border-gray-700 rounded-b-3xl">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about a crime..."
            className="flex-1 p-2 rounded-lg bg-gray-800 text-white focus:outline-none"
          />
          <button
            onClick={handleUserInput}
            className="ml-2 px-3 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
    )}
  </div>
  );
};

export default CrimeChatbot;
