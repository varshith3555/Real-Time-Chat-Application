import mongoose from "mongoose";
import crypto from "crypto";

// Generate a random 8-character key
const generateRandomKey = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Generate keys at schema definition time, not for each new document
const DEFAULT_PRIVATE_KEY = generateRandomKey();

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    privateKey: {
      type: String,
      default: DEFAULT_PRIVATE_KEY, // Use a fixed value, not a function reference
      required: true,
    },
    privateKeySet: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate a unique private key for each new user
userSchema.pre('save', function(next) {
  // Only generate a new private key if this is a new document
  if (this.isNew) {
    this.privateKey = generateRandomKey();
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
