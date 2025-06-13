const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

// Start or get conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'username');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, participantId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await conversation.save();
      
      // Populate participants after save
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username');
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.user._id;

    // Create new message
    const message = new Message({
      conversationId,
      senderId,
      text,
      createdAt: new Date(),
      read: false
    });
    await message.save();

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    });

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username');

    // Emit real-time update (via Socket.IO)
    req.io.to(conversationId.toString()).emit('newMessage', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get conversation messages
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user conversations
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'username')
    .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};