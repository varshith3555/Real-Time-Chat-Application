import express from "express";
import { searchUsersByEmail, updatePrivateKey, generateNewPrivateKey, verifyPrivateKey } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsersByEmail);
router.put("/private-key", protectRoute, updatePrivateKey);
router.post("/generate-private-key", protectRoute, generateNewPrivateKey);
router.post("/verify-private-key/:userId", protectRoute, verifyPrivateKey);

export default router; 