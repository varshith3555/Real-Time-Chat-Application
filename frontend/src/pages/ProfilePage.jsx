import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Sparkles, Trash2, Edit2, Check, X, Eye, EyeOff, Key, RefreshCw, Copy } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../lib/toast";

const ProfilePage = () => {
  const { 
    authUser, 
    isUpdatingProfile, 
    updateProfile, 
    updatePrivateKey, 
    generateNewPrivateKey 
  } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDeletingPic, setIsDeletingPic] = useState(false);
  const [animatedBg, setAnimatedBg] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(authUser?.fullName || "");
  const fileRef = useRef(null);
  
  // Private key states
  const [isEditingPrivateKey, setIsEditingPrivateKey] = useState(false);
  const [newPrivateKey, setNewPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

  // Enable background animation after initial render for smoother page load
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedBg(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Function to compress image before upload
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Max width/height for the image (maintain aspect ratio)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality (0.7 = 70% quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showErrorToast("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast("Image size should be less than 5MB");
      return;
    }

    try {
      setIsCompressing(true);
      const compressedImage = await compressImage(file);
      setSelectedImg(compressedImage);
      setIsCompressing(false);
      
      try {
        setIsUpdating(true);
        await updateProfile({ profilePic: compressedImage });
        showSuccessToast("Profile picture updated successfully!");
      } catch (error) {
        setSelectedImg(null); // Reset on error
        
        // More detailed error messages based on the error type
        if (error.response) {
          showErrorToast(error.response.data.message || "Failed to update profile picture");
        } else if (error.request) {
          showErrorToast("No response from server. Please check your connection.");
        } else {
          showErrorToast("Error updating profile: " + error.message);
        }
      } finally {
        setIsUpdating(false);
        setSelectedImg(null);
      }
    } catch (error) {
      setIsCompressing(false);
      setSelectedImg(null);
      showErrorToast("Error processing image. Please try again.");
      console.error("Image compression error:", error);
    }
  };

  const handleDeleteProfilePic = async () => {
    try {
      setIsDeletingPic(true);
      // Instead of null, we'll set it to the default avatar
      const defaultAvatarResponse = await fetch("/avatar.png");
      const defaultAvatarBlob = await defaultAvatarResponse.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          await updateProfile({ profilePic: reader.result });
          setSelectedImg(null);
          showSuccessToast("Profile picture reset to default!");
        } catch (error) {
          if (error.response) {
            showErrorToast(error.response.data.message || "Failed to reset profile picture");
          } else if (error.request) {
            showErrorToast("No response from server. Please check your connection.");
          } else {
            showErrorToast("Error resetting profile: " + error.message);
          }
        }
      };

      reader.readAsDataURL(defaultAvatarBlob);
    } catch (error) {
      showErrorToast("Error resetting profile picture. Please try again.");
    } finally {
      setIsDeletingPic(false);
    }
  };

  const handleNameUpdate = async () => {
    const trimmedName = newName.trim();
    
    // Don't make API call if name hasn't changed
    if (trimmedName === authUser.fullName) {
      setIsEditingName(false);
      return;
    }

    // Validate name length
    if (trimmedName.length < 2) {
      showErrorToast("Name must be at least 2 characters long");
      return;
    }

    try {
      setIsUpdating(true);
      await updateProfile({ fullName: trimmedName });
      showSuccessToast("Name updated successfully!");
      setIsEditingName(false);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Error updating name";
      showErrorToast(errorMessage);
      setNewName(authUser.fullName); // Reset to original name on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelNameEdit = () => {
    setNewName(authUser.fullName);
    setIsEditingName(false);
  };

  // Private key functions
  const handleUpdatePrivateKey = async () => {
    if (newPrivateKey.trim().length < 4) {
      showErrorToast("Private key must be at least 4 characters");
      return;
    }
    
    try {
      setIsUpdatingKey(true);
      await updatePrivateKey(newPrivateKey);
      showSuccessToast("Private key updated successfully!");
      setIsEditingPrivateKey(false);
      setNewPrivateKey("");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Error updating private key";
      showErrorToast(errorMessage);
    } finally {
      setIsUpdatingKey(false);
    }
  };
  
  const handleGenerateNewPrivateKey = async () => {
    try {
      setIsGeneratingKey(true);
      await generateNewPrivateKey();
      showSuccessToast("New private key generated successfully!");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Error generating new private key";
      showErrorToast(errorMessage);
    } finally {
      setIsGeneratingKey(false);
    }
  };
  
  const handleCopyPrivateKey = () => {
    if (authUser?.privateKey) {
      navigator.clipboard.writeText(authUser.privateKey);
      showSuccessToast("Private key copied to clipboard!");
    }
  };
  
  const handleCancelPrivateKeyEdit = () => {
    setNewPrivateKey("");
    setIsEditingPrivateKey(false);
  };

  return (
    <div className="min-h-screen pt-20 relative overflow-y-auto pb-24 bg-base-100">
      {/* Animated background - changed from absolute to fixed */}
      <div className="fixed inset-0 bg-grid-white bg-[length:20px_20px] opacity-10 -z-20"></div>
      
      {/* Gradient overlay that matches navbar - changed from absolute to fixed */}
      <div className={`fixed inset-0 bg-gradient-to-b from-purple-600/30 via-blue-500/10 to-cyan-400/5 
                      ${animatedBg ? 'animate-gradient' : ''} backdrop-blur-sm pointer-events-none -z-10`}></div>
      
      {/* Floating particles for dynamic effect - changed from absolute to fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/10 backdrop-blur-md animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 40 + 10}px`,
              height: `${Math.random() * 40 + 10}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 py-8 relative z-10">
        <div className="glass-dark rounded-xl p-6 space-y-8 shadow-xl border border-white/10
                       transition-all duration-300 hover:shadow-purple-500/10 animate-fadeIn mb-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
              <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 animate-shimmer">
                Profile
              </h1>
              <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <p className="mt-2 text-base-content/70">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4 relative">
            {/* Glow effect behind avatar */}
            <div className="absolute size-36 rounded-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-400/20 
                           blur-xl animate-pulse-slow"></div>
            
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-400/50 
                            blur-md animate-pulse-slow -z-10"></div>
              
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className={`size-32 rounded-full object-cover border-4 border-white/20 z-10
                           ${isUpdatingProfile || isCompressing || isDeletingPic ? "opacity-50" : ""}
                           transition-all duration-300 hover:border-white/30 shadow-lg`}
              />
              
              <div className="absolute bottom-0 right-0 z-20 flex gap-2">
                <label
                  htmlFor="avatar-upload"
                  className={`
                    bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105
                    p-2 rounded-full cursor-pointer shadow-lg
                    transition-all duration-300
                    ${(isUpdatingProfile || isCompressing || isDeletingPic) ? "animate-pulse pointer-events-none" : ""}
                  `}
                >
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    ref={fileRef}
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile || isCompressing || isDeletingPic}
                  />
                </label>

                {/* Delete button - only show if using custom profile picture */}
                {(selectedImg || (authUser?.profilePic && !authUser.profilePic.includes("avatar.png"))) && (
                  <button
                    onClick={handleDeleteProfilePic}
                    disabled={isUpdatingProfile || isCompressing || isDeletingPic}
                    className={`
                      bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105
                      p-2 rounded-full cursor-pointer shadow-lg
                      transition-all duration-300
                      ${(isUpdatingProfile || isCompressing || isDeletingPic) ? "animate-pulse pointer-events-none" : ""}
                    `}
                    title="Reset to default avatar"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-base-content/60 px-4 py-2 rounded-full bg-base-content/5 border border-base-content/10">
              {isCompressing 
                ? "Optimizing image..." 
                : isDeletingPic
                ? "Resetting to default avatar..."
                : isUpdating 
                  ? "Uploading..." 
                  : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5 group">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <div className="relative overflow-hidden rounded-lg transition-all duration-300 animate-border-shine">
                <div className="flex items-center space-x-2">
                  {isEditingName ? (
                    <>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded px-3 py-2 focus:outline-none focus:border-purple-500/50"
                        placeholder="Enter your name"
                        disabled={isUpdating}
                      />
                      <button
                        onClick={handleNameUpdate}
                        disabled={isUpdating}
                        className="p-2 text-green-500 hover:text-green-400 transition-colors"
                        title="Save"
                      >
                        <Check className="size-5" />
                      </button>
                      <button
                        onClick={handleCancelNameEdit}
                        disabled={isUpdating}
                        className="p-2 text-red-500 hover:text-red-400 transition-colors"
                        title="Cancel"
                      >
                        <X className="size-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 px-3 py-2">{authUser?.fullName}</span>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Edit name"
                      >
                        <Edit2 className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <div className="relative overflow-hidden rounded-lg transition-all duration-300 animate-border-shine">
                <p className="px-4 py-2.5 glass rounded-lg relative">
                  {authUser?.email}
                </p>
              </div>
            </div>

            {/* Private Key Section */}
            <div className="space-y-1.5 group">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Private Key
                <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  Required for new conversations
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg transition-all duration-300 animate-border-shine">
                <div className="flex items-center space-x-2">
                  {isEditingPrivateKey ? (
                    <>
                      <input
                        type={showPrivateKey ? "text" : "password"}
                        value={newPrivateKey}
                        onChange={(e) => setNewPrivateKey(e.target.value)}
                        className="flex-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded px-3 py-2 focus:outline-none focus:border-purple-500/50"
                        placeholder="Enter new private key (min 4 characters)"
                        disabled={isUpdatingKey}
                      />
                      <button
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title={showPrivateKey ? "Hide private key" : "Show private key"}
                      >
                        {showPrivateKey ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                      <button
                        onClick={handleUpdatePrivateKey}
                        disabled={isUpdatingKey}
                        className="p-2 text-green-500 hover:text-green-400 transition-colors"
                        title="Save"
                      >
                        <Check className="size-5" />
                      </button>
                      <button
                        onClick={handleCancelPrivateKeyEdit}
                        disabled={isUpdatingKey}
                        className="p-2 text-red-500 hover:text-red-400 transition-colors"
                        title="Cancel"
                      >
                        <X className="size-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 px-3 py-2 flex items-center">
                        <span className={`${showPrivateKey ? 'text-white' : 'blur-sm select-none'}`}>
                          {authUser?.privateKey || "••••••••"}
                        </span>
                        <button
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                          title={showPrivateKey ? "Hide private key" : "Show private key"}
                        >
                          {showPrivateKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                        {showPrivateKey && (
                          <button
                            onClick={handleCopyPrivateKey}
                            className="ml-1 p-1 text-gray-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="size-4" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setIsEditingPrivateKey(true)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Edit private key"
                      >
                        <Edit2 className="size-5" />
                      </button>
                      <button
                        onClick={handleGenerateNewPrivateKey}
                        disabled={isGeneratingKey}
                        className={`p-2 text-blue-500 hover:text-blue-400 transition-colors ${isGeneratingKey ? 'animate-spin' : ''}`}
                        title="Generate new private key"
                      >
                        <RefreshCw className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-base-content/60 px-4 py-2 rounded-full bg-base-content/5 border border-base-content/10">
                Your private key is required for others to start a new conversation with you
              </p>
            </div>
          </div>

          <div className="mt-6 glass rounded-xl p-6 border border-white/10 shadow-inner">
            <h2 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-content/10">
                <span className="text-base-content/70">Member Since</span>
                <span className="px-3 py-1 rounded-full bg-base-content/5 border border-base-content/10">
                  {authUser?.createdAt?.split("T")[0]}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/70">Account Status</span>
                <span className="text-green-500 flex items-center gap-1">
                  <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
