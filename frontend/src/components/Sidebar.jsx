import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus, X, Loader2, UserCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../lib/toast";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, searchUsersByEmail, verifyPrivateKey } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  
  // Private key modal states
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [selectedNewUser, setSelectedNewUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyError, setPrivateKeyError] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Add keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus search input on Ctrl+K or Command+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Close search results on Escape
      if (e.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        setSearchResults([]);
        setSearchQuery("");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const results = await searchUsersByEmail(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = (user) => {
    // Check if the user is already in the user list
    const existingUser = users.find(u => u._id === user._id);
    
    if (existingUser) {
      setSelectedUser(existingUser);
      // Clear search
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    } else {
      // For new users, show the private key modal
      setSelectedNewUser(user);
      setShowPrivateKeyModal(true);
      setPrivateKeyInput("");
      setShowPrivateKey(false);
    }
  };
  
  const handleVerifyPrivateKey = async () => {
    if (!privateKeyInput.trim()) {
      setPrivateKeyError("Please enter the recipient's private key");
      return;
    }
    
    setIsVerifying(true);
    setPrivateKeyError("");
    
    try {
      console.log(`Attempting to verify key: "${privateKeyInput.trim()}" for user ${selectedNewUser?._id}`);
      
      // Check if the entered key exactly matches the user's private key
      // This is a simple local check that we're doing for debugging purposes
      if (selectedNewUser && selectedNewUser.privateKey === privateKeyInput.trim()) {
        console.log("Keys match locally!");
      }
      
      // First verify the private key with the server
      const verificationResult = await verifyPrivateKey(selectedNewUser._id, privateKeyInput.trim());
      console.log("Server verification result:", verificationResult);
      
      if (!verificationResult.isValid) {
        console.error(`Key verification failed for: "${privateKeyInput.trim()}"`);
        setPrivateKeyError("Invalid private key. Please check and try again.");
        setIsVerifying(false);
        return;
      }
      
      // Use the verified key from the server to ensure we have the most up-to-date key
      const verifiedKey = verificationResult.verifiedKey || privateKeyInput.trim();
      console.log(`Using verified key from server: "${verifiedKey}"`);
      
      // If the key is valid, proceed with adding the user with the verified private key
      setSelectedUser(selectedNewUser, verifiedKey);
      
      // Clear search and modal
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      setShowPrivateKeyModal(false);
      setSelectedNewUser(null);
      setPrivateKeyInput("");
      
      // Show instructions about sending first message
      showSuccessToast("User added. Send a message to start the conversation.");
    } catch (error) {
      console.error("Error during key verification:", error);
      setPrivateKeyError(error.response?.data?.message || "Failed to verify private key");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full min-h-[calc(100vh-4rem)] w-20 lg:w-72 bg-white/[0.02] backdrop-blur-md flex flex-col transition-all duration-200 border-r border-white/5">
      <div className="p-4 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-white/70" />
            <span className="font-medium hidden lg:block text-white/90">Conversations</span>
          </div>
          
          {/* Small screen search button */}
          <button 
            onClick={() => searchInputRef.current?.focus()}
            className="lg:hidden p-2 rounded-full hover:bg-white/5 transition-colors"
            title="Search users"
          >
            <Search className="size-5 text-white/70" />
          </button>
        </div>

        {/* Search bar - Full width on mobile */}
        <div className="mt-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() && !showSearchResults) {
                  handleSearch({ preventDefault: () => {} });
                }
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white/80 
                       placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50
                       lg:block"
              placeholder="Find users by email... (Ctrl+K)"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                       hover:bg-white/10 transition-colors text-white/70"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </button>
          </form>
        </div>
        
        {/* Search Results - Full width on mobile */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-3 bg-gray-800/50 rounded-md p-2 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/80">Search Results</h4>
              <button 
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="p-1 rounded-full hover:bg-white/10 text-white/60"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map(user => (
                <div 
                  key={user._id} 
                  className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-8 rounded-full bg-white/5 backdrop-blur-sm p-0.5 flex-shrink-0">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="size-full rounded-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">{user.fullName}</div>
                      <div className="text-xs text-white/50 truncate">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartConversation(user)}
                    className="p-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors flex-shrink-0 ml-2"
                    title="Start conversation"
                  >
                    {users.some(u => u._id === user._id) ? (
                      <UserCheck className="size-3.5" />
                    ) : (
                      <UserPlus className="size-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showSearchResults && searchResults.length === 0 && !isSearching && (
          <div className="mt-3 bg-gray-800/50 rounded-md p-3 border border-white/10 hidden lg:block">
            <p className="text-sm text-white/60 text-center">No users found with that email</p>
          </div>
        )}
        
        {/* Online filter toggle - Responsive */}
        {users.length > 0 && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm text-white/70">Show online only</span>
            </label>
            <span className="text-xs text-white/50">
              ({users.filter(user => onlineUsers.includes(user._id)).length} online)
            </span>
          </div>
        )}
      </div>

      {/* Conversations list - Improved mobile layout */}
      {filteredUsers.length > 0 ? (
        <div className="overflow-y-auto flex-1 w-full py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-white/5 transition-colors
                ${selectedUser?._id === user._id ? "bg-white/5" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <div className="size-12 rounded-full bg-white/5 backdrop-blur-sm p-0.5">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-full rounded-full object-cover"
                  />
                </div>
                {onlineUsers.includes(user._id) && (
                  <div className="absolute bottom-0 right-0">
                    <div className="size-3 rounded-full bg-green-500"></div>
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping"></div>
                  </div>
                )}
              </div>

              {/* User info - Responsive visibility */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium text-white/90 truncate">{user.fullName}</div>
                <div className="text-sm text-white/50">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="p-3 bg-purple-500/20 rounded-full mb-4">
            <Mail className="size-8 text-purple-300" />
          </div>
          <h3 className="text-white/90 font-medium mb-1 text-center">No conversations yet</h3>
          <p className="text-white/60 text-sm text-center mb-6 px-2">
            Search for a user by email to start a new conversation
          </p>
          <button
            onClick={() => searchInputRef.current?.focus()}
            className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/40 text-purple-200
                     rounded-md flex items-center gap-2 transition-colors"
          >
            <Search className="size-4" />
            <span>Find Users</span>
          </button>
        </div>
      )}

      {/* Private Key Modal */}
      {showPrivateKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800/90 border border-white/10 rounded-lg p-6 max-w-md w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-purple-500/30">
                <Lock className="size-5 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold text-white">Enter Private Key</h3>
            </div>
            
            {selectedNewUser && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-5">
                <div className="size-12 rounded-full bg-white/5 backdrop-blur-sm p-0.5">
                  <img
                    src={selectedNewUser.profilePic || "/avatar.png"}
                    alt={selectedNewUser.fullName}
                    className="size-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-white/90">{selectedNewUser.fullName}</div>
                  <div className="text-sm text-white/50">{selectedNewUser.email}</div>
                </div>
              </div>
            )}
            
            <p className="text-white/80 mb-4">
              To start a new conversation with this user, please enter their private key.
              <span className="block mt-1 text-white/60 text-sm">
                This is a one-time verification required to initiate a conversation. 
                You must obtain the user's private key directly from them.
              </span>
            </p>
            
            <div className="mb-4">
              <label className="block text-white/80 text-sm font-medium mb-1">
                Enter user's private key
              </label>
              <div className="flex bg-white/5 border border-white/10 rounded-md overflow-hidden">
                <input
                  type={showPrivateKey ? "text" : "password"}
                  value={privateKeyInput}
                  onChange={(e) => {
                    // Always trim whitespace immediately on input
                    const value = e.target.value.trim();
                    console.log("Input key:", value);
                    setPrivateKeyInput(value);
                    if (privateKeyError) setPrivateKeyError("");
                  }}
                  className={`flex-1 px-3 py-2 bg-transparent text-white focus:outline-none ${privateKeyError ? 'border-red-500' : ''}`}
                  placeholder="Enter recipient's private key"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && privateKeyInput.trim()) {
                      e.preventDefault();
                      handleVerifyPrivateKey();
                    }
                  }}
                />
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="px-3 text-white/60 hover:text-white/90 transition-colors"
                  type="button"
                >
                  {showPrivateKey ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {privateKeyError && (
                <p className="text-red-400 text-sm mt-1">{privateKeyError}</p>
              )}
              
              {/* Add a helpful hint about copying/pasting the key */}
              <p className="text-white/50 text-xs mt-2">
                Tip: Copy and paste the key exactly as provided to avoid errors.
              </p>
            </div>
            
            <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3 text-purple-300 text-sm mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="size-4" />
                <span className="font-medium">Your private key to share with others:</span>
              </div>
              <div className="bg-purple-500/20 p-2 rounded font-mono text-center select-all">
                {authUser?.privateKey || ""}
              </div>
              <p className="mt-2 text-purple-300/80 text-xs">
                Share your private key with others so they can start conversations with you.
              </p>
            </div>
            
            {privateKeyError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-sm mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="size-4" />
                  <span className="font-medium">Verification failed</span>
                </div>
                <p className="text-xs">
                  The key you entered doesn't match the user's private key. Please verify the key with them and try again.
                </p>
                <div className="mt-2 p-2 bg-red-500/20 border border-red-500/20 rounded text-xs">
                  <p>
                    Debug info: Attempted to verify key "{privateKeyInput}" for user with ID: {selectedNewUser?._id}
                  </p>
                </div>
              </div>
            )}
            
            {selectedNewUser && selectedNewUser.privateKey && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 text-blue-300 text-sm mb-4">
                <p className="text-xs">
                  Debug info: User's stored privateKey in search results: "{selectedNewUser.privateKey || 'none'}"
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPrivateKeyModal(false);
                  setSelectedNewUser(null);
                  setPrivateKeyInput("");
                  setPrivateKeyError("");
                }}
                className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/80
                         transition-colors"
                disabled={isVerifying}
              >
                Cancel
              </button>
              
              <button
                onClick={handleVerifyPrivateKey}
                disabled={isVerifying || !privateKeyInput.trim()}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white
                         transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Start Conversation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
