import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Find all messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId }
      ]
    });
    
    // Extract unique user IDs from these conversations
    // (excluding the logged-in user's ID)
    const userIds = [...new Set(
      messages.map(msg => 
        msg.senderId.toString() === loggedInUserId.toString() 
          ? msg.receiverId.toString() 
          : msg.senderId.toString()
      )
    )];
    
    // Fetch user details for these IDs
    const conversationUsers = await User.find({ 
      _id: { $in: userIds } 
    }).select("-password -privateKey");
    
    res.status(200).json(conversationUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, images, privateKey } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check if receiver exists and get their latest privateKey
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if this is a first-time message (no previous conversations)
    const previousMessages = await Message.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    // If this is a first-time message, verify private key
    if (!previousMessages) {
      // Skip private key check if the receiver hasn't set their private key yet
      if (receiver.privateKeySet) {
        // Ensure we're comparing clean strings
        const receiverKey = receiver.privateKey ? String(receiver.privateKey).trim() : '';
        const providedKey = privateKey ? String(privateKey).trim() : '';
        
        console.log(`🔑 First message - comparing keys: "${providedKey}" to "${receiverKey}"`);
        
        if (providedKey !== receiverKey) {
          console.log(`❌ Invalid private key for first message: "${providedKey}" doesn't match "${receiverKey}"`);
          return res.status(403).json({ 
            message: "Invalid private key. You need the correct private key to start a conversation with this user.",
            requiresKey: true
          });
        }
        console.log(`✅ Private key verified for first message`);
      }
    }

    let imageUrls = [];
    if (images && images.length > 0) {
      // Process uploads in smaller parallel batches to prevent overloading
      const batchSize = 3; // Process 3 images at a time
      const batches = [];
      
      for (let i = 0; i < images.length; i += batchSize) {
        batches.push(images.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        // Upload batch in parallel
        const uploadPromises = batch.map(image => 
          cloudinary.uploader.upload(image, {
            timeout: 60000, // 1 minute timeout per image is sufficient with compression
            resource_type: "auto",
            quality: "auto", // Let Cloudinary optimize quality
            fetch_format: "auto", // Let Cloudinary serve the best format
            eager: [
              { width: 1200, height: 1200, crop: "limit" } // Resize large images
            ],
            // Use folder structure to organize images
            folder: `socketspeak/${senderId}`, 
          })
        );

        try {
          const uploadResponses = await Promise.all(uploadPromises);
          imageUrls = [...imageUrls, ...uploadResponses.map(response => response.secure_url)];
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          // Continue with any successful uploads rather than failing completely
        }
      }
      
      // If no images were successfully uploaded but images were attempted
      if (imageUrls.length === 0 && images.length > 0) {
        return res.status(500).json({ message: "Failed to upload images. Please try again." });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      images: imageUrls,
    });

    await newMessage.save();
    
    // Realtime functionality
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ message: "Error sending message" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    // Emit socket event to notify the recipient
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ message: "Error deleting message" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Find and delete all messages between the two users
    const deletedMessages = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    });

    // Emit socket event to notify the other user
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("conversationDeleted", myId);
    }

    res.status(200).json({ 
      message: "Conversation deleted successfully",
      count: deletedMessages.deletedCount
    });
  } catch (error) {
    console.log("Error in deleteConversation controller: ", error.message);
    res.status(500).json({ message: "Error deleting conversation" });
  }
};
