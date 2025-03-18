import express from "express";
import {
  getProducts,
  getfeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
  toggleFeaturedProduct
} from "../controllers/product.controller.js";
import { protectedRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Route should be protected and only be accesible via ADMIN...
router.get("/", protectedRoute, adminRoute, getProducts);
router.get("/featured", getfeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommend", getRecommendedProducts);
router.post("/", protectedRoute, adminRoute, createProduct);
router.put("/:_id", protectedRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:_id", protectedRoute, adminRoute, deleteProduct);

export default router;
