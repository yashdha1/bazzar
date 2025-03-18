import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: [true, "Please provide an image"], 
    },
    category: {
      type: String,
      required: true,
    }, 
    isFeatured: {
      type: Boolean,
      default: false 
    }
  },
  {timestamps: true}
);


const Product = mongoose.model("Product", productSchema); 
export default Product ; 