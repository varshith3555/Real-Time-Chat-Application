import User from "../models/user.model.js";
import crypto from "crypto";

export const searchUsersByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const loggedInUserId = req.user._id;

    if (!email) {
      return res.status(400).json({ message: "Email query parameter is required" });
    }

    // Search for users whose email contains the search term (case-insensitive)
    // Exclude the logged-in user from results
    const users = await User.find({
      email: { $regex: email, $options: "i" },
      _id: { $ne: loggedInUserId }
    }).select("-password -privateKey");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersByEmail: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePrivateKey = async (req, res) => {
  try {
    const userId = req.user._id;
    const { privateKey } = req.body;

    // Validate that privateKey is at least 4 characters
    if (!privateKey || privateKey.length < 4) {
      return res.status(400).json({ message: "Private key must be at least 4 characters" });
    }

    // Update the user's private key
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        privateKey,
        privateKeySet: true
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      privateKey: updatedUser.privateKey,
      privateKeySet: updatedUser.privateKeySet,
    });
  } catch (error) {
    console.error("Error in updatePrivateKey: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const generateNewPrivateKey = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Generate a new random key
    const newPrivateKey = crypto.randomBytes(4).toString('hex');
    
    // Update the user's private key
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        privateKey: newPrivateKey,
        privateKeySet: true
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      privateKey: updatedUser.privateKey,
      privateKeySet: updatedUser.privateKeySet,
    });
  } catch (error) {
    console.error("Error in generateNewPrivateKey: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add a new function to verify a user's private key
export const verifyPrivateKey = async (req, res) => {
  try {
    const { userId } = req.params;
    let { privateKey } = req.body;
    
    console.log(`🔑 Verification Request - userId: ${userId}, privateKey: "${privateKey}"`);
    
    if (!privateKey) {
      console.log("❌ Private key is missing in the request");
      return res.status(400).json({ message: "Private key is required", isValid: false });
    }
    
    // Make sure we're working with a string and trim it
    privateKey = String(privateKey).trim();
    
    // Always fetch the fresh user with private key from database
    const user = await User.findById(userId).select('+privateKey');
    if (!user) {
      console.log(`❌ User with ID ${userId} not found`);
      return res.status(404).json({ message: "User not found", isValid: false });
    }

    // Ensure we're comparing clean strings
    const userKey = user.privateKey ? String(user.privateKey).trim() : '';
    
    console.log(`🔐 Comparing keys - User's key from DB: "${userKey}", Provided key: "${privateKey}"`);
    
    // Verify the private key - strict equality check
    const isKeyValid = userKey === privateKey;
    
    console.log(`✅ Keys match: ${isKeyValid}`);
    
    if (isKeyValid) {
      // Return success with the verified private key for the client to store
      console.log("🎉 Private key verified successfully");
      return res.status(200).json({ 
        message: "Private key verified successfully",
        isValid: true,
        verifiedKey: userKey
      });
    } else {
      console.log(`❌ Invalid key provided: "${privateKey}" doesn't match "${userKey}"`);
      return res.status(403).json({ 
        message: "Invalid private key. You need the correct private key to start a conversation with this user.",
        isValid: false
      });
    }
  } catch (error) {
    console.error("💥 Error in verifyPrivateKey: ", error.message);
    res.status(500).json({ message: "Internal server error", isValid: false });
  }
}; 