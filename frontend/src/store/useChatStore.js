import { create } from "zustand";
import { showErrorToast } from "../lib/toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error loading users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUsersByEmail: async (email) => {
    try {
      const res = await axiosInstance.get(`/users/search?email=${email}`);
      return res.data;
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error searching users");
      return [];
    }
  },

  verifyPrivateKey: async (userId, privateKey) => {
    try {
      // Make sure we have valid parameters
      if (!userId || !privateKey) {
        console.error("Missing userId or privateKey:", { userId, privateKey });
        return false;
      }
      
      console.log(`Verifying key: "${privateKey}" for user: ${userId}`);
      
      // Make sure the privateKey is properly trimmed and sent as a string
      const trimmedKey = String(privateKey).trim();
      
      console.log(`Sending verification request with key: "${trimmedKey}"`);
      
      const response = await axiosInstance.post(`/users/verify-private-key/${userId}`, 
        { privateKey: trimmedKey },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log("Verification response:", response.data);
      const isValid = response.data.isValid === true;
      console.log(`Key verification result: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
      
      // Return both the validation result and the server-verified key
      return {
        isValid,
        verifiedKey: response.data.verifiedKey || trimmedKey // Use server's verified key if available
      };
    } catch (error) {
      console.error("Error verifying private key:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      // Don't show toast here, let the component handle the error
      return { isValid: false };
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error loading messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // Prepare message data with proper structure
      const messagePayload = {
        text: messageData.text || "",
        images: messageData.images || [],
        privateKey: messageData.privateKey || selectedUser.privateKey // Include verified key if available
      };
      
      // If there's a single 'image' property for backward compatibility
      if (messageData.image && !messageData.images) {
        messagePayload.images = [messageData.image];
      }
      
      // Add an optimistic message with a temporary ID to the UI immediately
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        _id: optimisticId,
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedUser._id,
        text: messagePayload.text,
        images: messagePayload.images,
        createdAt: new Date().toISOString(),
        isOptimistic: true // Flag to identify temporary messages
      };
      
      // Update UI immediately with optimistic message
      set({ messages: [...messages, optimisticMessage] });
      
      // Make API call
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messagePayload);
      
      // Replace optimistic message with real one
      set({
        messages: messages
          .filter(msg => msg._id !== optimisticId)
          .concat(res.data)
      });
      
      return res.data;
    } catch (error) {
      // Remove optimistic messages on error
      set({
        messages: messages.filter(msg => !msg.isOptimistic)
      });
      
      // Check if this is a private key error
      if (error.response?.status === 403 && error.response?.data?.requiresKey) {
        return { requiresKey: true, message: error.response.data.message };
      }
      
      showErrorToast(error.response?.data?.message || "Error sending message");
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();
    try {
      // First update the UI optimistically
      set({ messages: messages.filter(msg => msg._id !== messageId) });
      
      // Then make the API call
      await axiosInstance.delete(`/messages/${messageId}`);
      
      return true; // Return success to show success toast
    } catch (error) {
      // Revert the optimistic update on error
      set({ messages });
      throw error;
    }
  },

  deleteConversation: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    try {
      // Clear messages optimistically
      set({ messages: [] });
      
      // Make the API call
      await axiosInstance.delete(`/messages/conversation/${selectedUser._id}`);
      
      return true; // Return success to show success toast
    } catch (error) {
      // On error, reload messages
      await get().getMessages(selectedUser._id);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Listen for message deletions
    socket.on("messageDeleted", (deletedMessageId) => {
      set({
        messages: get().messages.filter(msg => msg._id !== deletedMessageId),
      });
    });

    // Listen for conversation deletions
    socket.on("conversationDeleted", (userId) => {
      if (get().selectedUser && get().selectedUser._id === userId) {
        set({ messages: [] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("conversationDeleted");
  },

  setSelectedUser: (user, privateKey = null) => {
    if (!user) {
      set({ selectedUser: null });
      return;
    }
    
    // Handle the user's private key
    let enhancedUser;
    
    if (privateKey) {
      // If private key is provided, add it to the user object
      enhancedUser = { 
        ...user, 
        privateKey: String(privateKey).trim(),
        // Flag that this key has been verified 
        keyVerified: true
      };
    } else {
      // If no private key is provided, create a copy without modifying any existing key
      enhancedUser = { ...user };
    }
    
    // If the user is not in the current users list, add them
    const { users } = get();
    if (!users.some(u => u._id === user._id)) {
      set({ users: [...users, enhancedUser] });
    }
    
    set({ selectedUser: enhancedUser });
  },
}));
