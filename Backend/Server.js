const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json()); // Parses JSON request bodies

// Connect to MongoDB
connectDB();

// Routes
const investigatorRoutes = require("./routes/investigatorRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/investigators", investigatorRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`🟢 New client connected: ${socket.userId} (${socket.userRole})`);

  // Join user's personal room for notifications
  socket.join(socket.userId);

  // Join all conversation rooms this user is part of
  socket.on("joinConversations", async () => {
    try {
      const Conversation = require('./models/conversation');
      const conversations = await Conversation.find({
        participants: socket.userId
      });
      
      conversations.forEach(conv => {
        socket.join(conv._id.toString());
        console.log(`User ${socket.userId} joined conversation ${conv._id}`);
      });
    } catch (error) {
      console.error('Error joining conversations:', error);
    }
  });

  // Handle real-time message delivery
  socket.on("sendMessage", async (messageData) => {
    try {
      const { conversationId, text } = messageData;
      const Message = require('./models/message');
      const Conversation = require('./models/conversation');

      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId
      });

      if (!conversation) {
        throw new Error('User not authorized for this conversation');
      }

      // Create and save new message
      const message = new Message({
        conversationId,
        senderId: socket.userId,
        text,
        read: false
      });
      await message.save();

      // Update conversation last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      // Emit to all participants in the conversation
      io.to(conversationId.toString()).emit("receiveMessage", {
        ...message.toObject(),
        senderId: {
          _id: socket.userId,
          username: socket.handshake.auth.username || 'Unknown'
        }
      });

      console.log(`Message sent to conversation ${conversationId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: error.message });
    }
  });

  // Handle typing indicators
  socket.on("typing", ({ conversationId, isTyping }) => {
    socket.to(conversationId.toString()).emit("typing", {
      userId: socket.userId,
      isTyping
    });
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.userId}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});