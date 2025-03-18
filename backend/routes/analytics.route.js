import express from "express"; 
import { protectedRoute, adminRoute } from "../middleware/auth.middleware.js"; 
import { getAnalytics } from "../controllers/analytic.controller.js";

const router = express.Router();
 
router.post('/', protectedRoute, adminRoute, getAnalytics)

export default router; 