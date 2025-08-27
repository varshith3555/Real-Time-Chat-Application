import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { showSuccessToast, showErrorToast } from "../lib/toast";
import { io } from "socket.io-client";

// For development: http://localhost:5001
// For production: URL of the deployed app
const BASE_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5001" 
  : window.location.origin;

console.log("Socket connection URL:", BASE_URL);

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      showSuccessToast("Account created successfully");
      get().connectSocket();
    } catch (error) {
      showErrorToast(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      showSuccessToast("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      showErrorToast(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      showSuccessToast("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      showErrorToast(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
    } catch (error) {
      console.log("error in update profile:", error);
      
      // More robust error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
        return Promise.reject(error); // Propagate the error to the component
      } else if (error.request) {
        // The request was made but no response was received
        console.log("Error request:", error.request);
        return Promise.reject(error); // Propagate the error to the component
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error message:", error.message);
        return Promise.reject(error); // Propagate the error to the component
      }
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updatePrivateKey: async (privateKey) => {
    try {
      const res = await axiosInstance.put("/users/private-key", { privateKey });
      set({ authUser: res.data });
      showSuccessToast("Private key updated successfully");
      return res.data;
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error updating private key");
      throw error;
    }
  },
  
  generateNewPrivateKey: async () => {
    try {
      const res = await axiosInstance.post("/users/generate-private-key");
      set({ authUser: res.data });
      showSuccessToast("New private key generated successfully");
      return res.data;
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error generating new private key");
      throw error;
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    console.log('Connecting to socket at:', BASE_URL);
    
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
    
    // Listen for image download events
    socket.on("imageDownload", (data) => {
      console.log("Image download event received", data);
      if (data.imageUrl) {
        handleImageDownload(data.imageUrl, data.filename || 'image.jpg');
      }
    });
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));

// Helper function to download an image
function handleImageDownload(imageUrl, filename) {
  fetch(imageUrl)
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showSuccessToast("Image download started");
    })
    .catch(error => {
      console.error("Error downloading image:", error);
      showErrorToast("Failed to download image");
    });
}
