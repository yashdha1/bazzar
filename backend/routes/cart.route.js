import express from "express";
import {
  addToCart,
  removeAllFromCart,
  updateQuantity, 
  getAllProducts
} from "../controllers/cart.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/" , protectedRoute , getAllProducts);
router.post("/", protectedRoute, addToCart); // protect this route and make it accessible only to logged in users.
router.delete("/", protectedRoute, removeAllFromCart);
router.put("/:id", protectedRoute, updateQuantity); 

export default router;
