import express from "express";
import {
  login,
  logout,
  signup,
  refreshTokens,
  getProfile,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refreshToken", refreshTokens);
router.get("/profile", protectedRoute, getProfile);

export default router;
