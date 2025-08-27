import toast from "react-hot-toast";

// Tracks recently shown toast messages to prevent duplicates
const shownToasts = new Set();
const TOAST_DEBOUNCE_TIME = 3000; // 3 seconds

/**
 * Shows a success toast message with debounce to prevent duplicates
 * @param {string} message - The message to display
 */
export const showSuccessToast = (message) => {
  if (shownToasts.has(message)) {
    return; // Skip if the same message was shown recently
  }
  
  toast.success(message);
  shownToasts.add(message);
  
  // Remove from tracking after debounce time
  setTimeout(() => {
    shownToasts.delete(message);
  }, TOAST_DEBOUNCE_TIME);
};

/**
 * Shows an error toast message with debounce to prevent duplicates
 * @param {string} message - The message to display
 */
export const showErrorToast = (message) => {
  if (shownToasts.has(message)) {
    return; // Skip if the same message was shown recently
  }
  
  toast.error(message);
  shownToasts.add(message);
  
  // Remove from tracking after debounce time
  setTimeout(() => {
    shownToasts.delete(message);
  }, TOAST_DEBOUNCE_TIME);
}; 