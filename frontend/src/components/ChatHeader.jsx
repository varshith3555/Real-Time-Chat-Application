import { useState } from "react";
import { X, Trash2, AlertCircle, Loader2, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { showSuccessToast, showErrorToast } from "../lib/toast";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, deleteConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [confirmationError, setConfirmationError] = useState(false);

  const handleDeleteConversation = async () => {
    if (confirmationInput !== "1") {
      setConfirmationError(true);
      return;
    }

    try {
      setIsDeleting(true);
      setConfirmationError(false);
      await deleteConversation();
      showSuccessToast("Conversation deleted successfully");
      setShowDeleteConfirm(false);
      setConfirmationInput("");
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Error deleting conversation");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 bg-white/[0.02] backdrop-blur-md relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="size-10 rounded-full bg-white/5 backdrop-blur-sm p-0.5">
              <img 
                src={selectedUser.profilePic || "/avatar.png"} 
                alt={selectedUser.fullName}
                className="rounded-full" 
              />
            </div>
            {/* Online status indicator */}
            {onlineUsers.includes(selectedUser._id) && (
              <div className="absolute bottom-0 right-0">
                <div className="size-2.5 rounded-full bg-green-500"></div>
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping"></div>
              </div>
            )}
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium text-white/90">{selectedUser.fullName}</h3>
            <p className="text-sm text-white/50">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Delete conversation button */}
          <button 
            onClick={() => {
              setShowDeleteConfirm(true);
              setConfirmationError(false);
              setConfirmationInput("");
            }}
            className="p-2 rounded-full hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
            title="Delete conversation"
          >
            <Trash2 className="size-5" />
          </button>
          
          {/* Close button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="size-5 text-white/70" />
          </button>
        </div>
      </div>
      
      {/* Maintenance note */}
      <div className="mt-2 px-3 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-md flex items-start gap-2">
        <Info className="size-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          Please delete your conversation after completion to help maintain server performance and prevent service interruptions.
        </p>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800/90 border border-white/10 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4 text-yellow-500">
              <AlertCircle className="size-6" />
              <h3 className="text-xl font-semibold text-white">Delete Conversation</h3>
            </div>
            
            <p className="text-white/80 mb-3">
              Are you sure you want to delete this entire conversation? This action cannot be undone and will remove all messages between you and {selectedUser.fullName}.
            </p>
            
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md mb-4">
              <p className="text-green-300 text-sm">
                <span className="font-medium">Server maintenance note:</span> Deleting completed conversations helps improve server performance and prevents potential issues. Thank you for helping maintain the service!
              </p>
            </div>
            
            <div className="mb-5">
              <label className="block text-white/80 mb-2 text-sm">
                Enter "1" to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => {
                  setConfirmationInput(e.target.value);
                  if (confirmationError) setConfirmationError(false);
                }}
                className={`w-full px-3 py-2 bg-gray-700/50 border ${
                  confirmationError ? 'border-red-500' : 'border-white/10'
                } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                placeholder="Enter 1 to confirm"
              />
              {confirmationError && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> Please enter "1" to delete conversation
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmationInput("");
                  setConfirmationError(false);
                }}
                className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/80
                         transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-red-500/70 hover:bg-red-500/90 text-white
                         transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    <span>Delete Conversation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
