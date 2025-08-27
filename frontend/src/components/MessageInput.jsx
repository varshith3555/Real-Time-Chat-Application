import { useState, useRef, useCallback, useEffect } from "react";
import { Send, ImageIcon, Loader2, X, AlertCircle } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { showErrorToast, showSuccessToast } from "../lib/toast";

// Image compression constants
const IMAGE_QUALITY = 0.6; // 60% quality - good balance between quality and size
const MAX_IMAGE_WIDTH = 1200; // Max width for images
const MAX_IMAGE_HEIGHT = 1200; // Max height for images
const MESSAGE_COUNT_WARNING = 50; // Show warning when conversation has this many messages

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const imageRef = useRef(null);
  const { sendMessage, selectedUser, messages } = useChatStore();
  const { authUser } = useAuthStore();
  
  // Determine if this is a new conversation (no previous messages)
  const [isNewConversation, setIsNewConversation] = useState(false);
  // Determine if we should show maintenance warning
  const showMaintenanceWarning = messages.length >= MESSAGE_COUNT_WARNING;
  
  useEffect(() => {
    // Check if this is a new conversation (no previous messages)
    setIsNewConversation(messages.length === 0);
  }, [messages, selectedUser]);

  // Efficient image compression function
  const compressImage = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          // Only scale down, not up
          if (width > MAX_IMAGE_WIDTH) {
            height = Math.round(height * (MAX_IMAGE_WIDTH / width));
            width = MAX_IMAGE_WIDTH;
          }
          
          if (height > MAX_IMAGE_HEIGHT) {
            width = Math.round(width * (MAX_IMAGE_HEIGHT / height));
            height = MAX_IMAGE_HEIGHT;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Use the file's type if possible, fallback to jpeg
          const mimeType = file.type || 'image/jpeg';
          const quality = mimeType === 'image/jpeg' || mimeType === 'image/webp' ? IMAGE_QUALITY : 1.0;
          
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: new Date().getTime()
              });
              resolve({
                file: compressedFile,
                dataUrl: canvas.toDataURL(mimeType, quality)
              });
            },
            mimeType,
            quality
          );
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && selectedImages.length === 0) || isLoading) return;

    try {
      setIsLoading(true);
      setProgress(0);
      
      // Create optimistic message without waiting for server
      const optimisticImages = selectedImages.map(img => img.dataUrl || img);
      const messageData = {
        text: message.trim(),
        images: optimisticImages
      };
      
      // Add private key for new conversations
      if (isNewConversation) {
        // Use the private key that was collected during conversation creation
        messageData.privateKey = selectedUser.privateKey;
      }
      
      // Update UI immediately
      setMessage("");
      setSelectedImages([]);
      
      // Send in batches if there are many images
      let result;
      if (messageData.images.length > 5) {
        // For many images, send in batches to prevent timeouts
        const batchSize = 5;
        const batches = [];
        
        for (let i = 0; i < messageData.images.length; i += batchSize) {
          batches.push(messageData.images.slice(i, i + batchSize));
        }
        
        // First message contains text and first batch
        const firstBatchMessage = {
          text: messageData.text,
          images: batches[0],
          privateKey: messageData.privateKey // Include private key in first message of batch
        };
        
        result = await sendMessage(firstBatchMessage);
        
        // Send remaining batches as follow-up messages (no need for private key)
        if (batches.length > 1) {
          for (let i = 1; i < batches.length; i++) {
            setProgress(Math.round((i / batches.length) * 100));
            await sendMessage({
              text: '',
              images: batches[i]
            });
          }
        }
      } else {
        // For fewer images, send as one message
        result = await sendMessage(messageData);
      }
      
      setProgress(100);
      showSuccessToast("Message sent successfully");
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Handle specific private key errors
      if (error?.response?.data?.message?.includes("private key")) {
        showErrorToast("Invalid private key. Please check and try again.");
      } else {
        showErrorToast(error?.message || "Error sending message");
      }
      
      // Allow user to try again with the same content
      if (selectedImages.length > 0) {
        setSelectedImages(selectedImages);
      }
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || !files.length) return;

    console.log(`Selected ${files.length} files`);
    setIsLoading(true);
    
    // Limit to maximum 30 images at once
    if (selectedImages.length + files.length > 30) {
      showErrorToast("Maximum 30 images allowed per message");
      // If we already have some images, only add new ones up to the limit
      if (selectedImages.length < 30) {
        const remainingSlots = 30 - selectedImages.length;
        files.splice(remainingSlots);
      } else {
        setIsLoading(false);
        return;
      }
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        showErrorToast(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        showErrorToast(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Process images in small batches to prevent UI freezing
      const batchSize = 3; // Process 3 images at a time
      const newImages = [...selectedImages];
      
      for (let i = 0; i < validFiles.length; i += batchSize) {
        const batch = validFiles.slice(i, i + batchSize);
        setProgress(Math.round((i / validFiles.length) * 100));
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            try {
              // Compress image
              const compressed = await compressImage(file);
              return compressed;
            } catch (error) {
              console.error(`Error processing ${file.name}:`, error);
              return null;
            }
          })
        );
        
        // Add successful results to newImages
        newImages.push(...batchResults.filter(result => result !== null));
        
        // Update selectedImages incrementally
        setSelectedImages([...newImages]);
        
        // Allow UI to refresh between batches
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setProgress(100);
      console.log(`Successfully processed ${newImages.length - selectedImages.length} images`);
    } catch (error) {
      console.error("Error processing images:", error);
      showErrorToast("Error processing images");
    } finally {
      setIsLoading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/5">
      {selectedImages.length > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-purple-300">{selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected</p>
            <button 
              type="button" 
              onClick={() => setSelectedImages([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-2 pb-2 overflow-x-auto max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={image.dataUrl || image}
                  alt={`Selected ${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500/90 transition-colors"
                    title="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {progress > 0 && (
        <div className="w-full h-1 bg-gray-700 rounded-full mb-3">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-200" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {isNewConversation && (
        <div className="mb-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <span className="font-medium">New conversation - </span>
            Your first message will be sent with the recipient's private key for verification.
          </p>
        </div>
      )}
      
      {showMaintenanceWarning && (
        <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
          <AlertCircle className="text-amber-400 size-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            This conversation has {messages.length} messages. Consider deleting it when complete to maintain optimal server performance.
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Send a message..."
            className="w-full bg-white/5 backdrop-blur-sm text-white rounded-full px-4 py-2 pr-12
                     focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full
                     hover:bg-white/10 transition-colors hover:bg-purple-500/10 relative"
            disabled={isLoading}
            title="Add images (up to 30)"
          >
            <ImageIcon className="size-5 text-purple-500" />
            {selectedImages.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedImages.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="submit"
          className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 disabled:opacity-50
                   hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300
                   disabled:cursor-not-allowed flex-shrink-0"
          disabled={(!message.trim() && selectedImages.length === 0) || isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </button>

        <input
          type="file"
          ref={imageRef}
          onChange={handleImageChange}
          multiple
          accept="image/*"
          className="hidden"
          aria-label="Upload images"
        />
      </div>
    </form>
  );
};

export default MessageInput;
