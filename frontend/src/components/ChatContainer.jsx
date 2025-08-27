import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Trash2, Loader2, Download, X, DownloadCloud, ExternalLink, Maximize2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../lib/toast";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [galleryImages, setGalleryImages] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [currentViewingImage, setCurrentViewingImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages, selectedUser._id]);

  const handleDeleteMessage = async (messageId) => {
    try {
      setDeletingMessageId(messageId);
      await deleteMessage(messageId);
      showSuccessToast("Message deleted successfully");
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error deleting message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleDownloadImage = (imageUrl, index) => {
    // Extract filename from URL or create a default one
    let filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${index}.jpg`;
    
    // Make sure filename has an extension
    if (!filename.includes('.')) {
      filename += '.jpg';
    }
    
    // Fetch the image and create a blob URL for download
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create a blob URL for the image
        const blobUrl = URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        
        // Required for Firefox
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        showSuccessToast("Image download started");
      })
      .catch(error => {
        console.error("Error downloading image:", error);
        showErrorToast("Failed to download image");
      });
  };

  const handleDownloadAllImages = async (images) => {
    if (!images || images.length === 0) return;
    
    try {
      setIsDownloadingAll(true);
      
      for (let i = 0; i < images.length; i++) {
        // Add a small delay between downloads to prevent overwhelming the browser
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Use the existing download function
        await fetch(images[i])
          .then(response => response.blob())
          .then(blob => {
            // Create a filename
            let filename = images[i].split('/').pop()?.split('?')[0] || `image-${i}.jpg`;
            if (!filename.includes('.')) {
              filename += '.jpg';
            }
            
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          });
      }
      
      showSuccessToast(`${images.length} images download started`);
    } catch (error) {
      console.error("Error downloading images:", error);
      showErrorToast("Failed to download some images");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const openImageGallery = (images) => {
    setGalleryImages(images);
    // Prevent scrolling when gallery is open
    document.body.style.overflow = 'hidden';
  };

  const closeImageGallery = () => {
    setGalleryImages(null);
    // Restore scrolling
    document.body.style.overflow = '';
  };

  const handleViewImage = (imageUrl) => {
    setIsImageLoading(true);
    
    // Fetch the image and create a blob URL for viewing
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create a blob URL for the image
        const blobUrl = URL.createObjectURL(blob);
        
        // Set current viewing image
        setCurrentViewingImage(blobUrl);
        setIsImageLoading(false);
      })
      .catch(error => {
        console.error("Error loading image:", error);
        showErrorToast("Failed to load image");
        setIsImageLoading(false);
      });
  };

  const closeImageView = () => {
    if (currentViewingImage) {
      URL.revokeObjectURL(currentViewingImage);
      setCurrentViewingImage(null);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-cyan-900/5">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-[calc(100vh-4rem)] relative overflow-hidden">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((message, idx) => (
          <div
            key={message._id || `temp-${idx}`}
            className={`flex ${
              message.senderId === authUser._id ? "justify-end" : "justify-start"
            } items-end gap-2 max-w-full`}
          >
            {/* Message content */}
            <div className={`group relative max-w-[85%] sm:max-w-[75%] break-words rounded-2xl px-4 py-2 ${
              message.senderId === authUser._id 
                ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/5" 
                : "bg-white/5 backdrop-blur-sm border border-white/5"
            }`}>
              {/* Delete button - only show for user's own messages */}
              {message.senderId === authUser._id && (
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  disabled={deletingMessageId === message._id}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500/80 text-white 
                           hover:bg-red-500/90 transition-colors opacity-0 group-hover:opacity-100
                           disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  title="Delete message"
                >
                  {deletingMessageId === message._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              )}

              {/* Message text */}
              <div className="text-sm text-white/90 whitespace-pre-wrap break-words">
                {message.text}
              </div>

              {/* Images grid - responsive */}
              {message.images && message.images.length > 0 && (
                <div className={`mt-2 grid gap-2 ${
                  message.images.length === 1 ? 'grid-cols-1' :
                  message.images.length === 2 ? 'grid-cols-2' :
                  message.images.length === 3 ? 'grid-cols-2' :
                  'grid-cols-2'
                } max-w-full`}>
                  {message.images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`relative group/image rounded-lg overflow-hidden ${
                        message.images.length === 3 && index === 2 ? 'col-span-2' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Message attachment ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        style={{
                          maxHeight: message.images.length === 1 ? '300px' : '200px'
                        }}
                        loading="lazy"
                        onClick={() => handleImageClick(image)}
                      />
                      {/* Download button overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(image, index);
                          }}
                          className="p-2 rounded-full bg-purple-500/80 text-white hover:bg-purple-500/90 transition-colors"
                          title="Download image"
                        >
                          <Download className="size-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div className="text-[10px] text-white/40 mt-1">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Optimistic message indicator */}
              {message.isOptimistic && (
                <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
                  <div className="animate-pulse flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                    <div className="h-2 w-2 rounded-full bg-white animation-delay-100"></div>
                    <div className="h-2 w-2 rounded-full bg-white animation-delay-200"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Add scroll anchor div */}
        <div ref={messageEndRef} />
      </div>

      {/* Image gallery modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <img
              src={selectedImage}
              alt="Selected image"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadImage(selectedImage, 0);
                }}
                className="p-2 rounded-full bg-purple-500/80 text-white/90 hover:bg-purple-500/90 transition-colors"
                title="Download image"
              >
                <Download className="size-5" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/70 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message input */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
