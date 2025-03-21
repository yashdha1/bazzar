import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },
  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },
  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      console.log( "prods" ,  res.data); 
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
  },
  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart");

      set((state) => {
        const existingItem = state.cart.find(
          (item) => item._id === product._id
        );
        let newCart;

        if (existingItem) {
          newCart = state.cart.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newCart = [...state.cart, { ...product, quantity: 1 }];
        }

        return { cart: newCart };
      });

      get().calculateTotals();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to add item to cart"
      );
    }
  },
  removeFromCart: async (productId) => {
    try {
		console.log("delete functionality called!!")
      await axios.delete(`/cart`, { data: { productId } });
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== productId),
      }));
      get().calculateTotals();
    } catch (error) {
      console.log("ERROR IN THE REMOVE FROM CART");
    }
  },
  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      await get().removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`/cart/${productId}`, { quantity });

      set((state) => ({
          cart: state.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        ),
      }));
      get().calculateTotals() ;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  },
  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let total = subtotal;

    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
}));
