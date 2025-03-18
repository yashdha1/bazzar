// maintains a Global store for all products Ki herra pheri :-

import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useProductStore = create((set) => ({
  products: [],
  loading: false,
  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      console.log(productData);
      console.log("request to API");
      const res = await axios.post("/product", productData, {
        withCredentials: true,
      });
      console.log(productData);
      console.log("request to API");

      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
      }));
      toast.success("Product Created Successfully!");
    } catch (error) {
      toast.error("Server Error!");
      set({ loading: false });
      console.log(error);
    }
  },
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/product");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response.data.error || "Failed to fetch products");
    }
  },
  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/product/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
        loading: false,
      }));
      toast.success("Product deleted successfully") ;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to delete product");
    }
  },
  toggleFeaturedProduct: async (productId) => {
    set((state) => ({
        products: state.products.map((product) =>
            product._id === productId ? { ...product, isFeatured: !product.isFeatured } : product
        ),
        loading: true,
    }));

    try {
        const response = await axios.put(`/product/${productId}`);
        console.log("API Response:", response.data.product.isFeatured);

        if (!response.data) {
            throw new Error("Invalid API response");
        }

        set((state) => ({
            products: state.products.map((product) =>
                product._id === productId ? { ...product, isFeatured: response.data.product.isFeatured } : product
            ),
            loading: false,
        }));
    } catch (error) {
        console.error("Toggle Error:", error.response?.data || error.message);
        toast.error(error.response?.data?.error || "Failed to update product");
    }
  },


  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/product/category/${category}`);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response.data.error || "Failed to fetch products");
    }
  },
}));
