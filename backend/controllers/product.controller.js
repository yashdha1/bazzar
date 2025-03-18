import express from "express";
import Product from "../model/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
//helper 
const updateFeaturedProductCache = async  ()=>{
    try {
        const featuredProduct = await Product.find({isFeatured: true}).lean() ;
        await redis.set("featuredProduct" , JSON.stringify(featuredProduct));
    } catch (error) {
        console.log("Error in updating the cache: ", error);
    }
}

// endpoinds controllers : 
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}); //  find all the products in the Object...
    res.json({ products });
  } catch (error) {
    console.log("Error in getProducts CONTROLLER");
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
export const getfeaturedProducts = async (req, res) => {
  // store all the features in the REDIS as well
  // cause the REDIS will fetch the products faster than the MONGO DB..
  try {
    let featuredProducts = await redis.get("featuredProducts"); // get hte featured products from the REdis DB :
    if (featuredProducts) {
      return res.json({ products: JSON.parse(featuredProducts) });
    }
    // if not in redis : get from MONGO DB :
    // .lean(): returns JS object, which is faster...
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.json({ products: "None products found..." });
    }
    // store in redis : for faster later access:
    // .set(keyName, Value)
    await redis.set(featuredProducts, JSON.stringify(featuredProducts));
  } catch (error) {}
};
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category, image } = req.body;
    if (!name || !price || !description || !category || !image) {
      return res.status(400).send("All fields are required.");
    }
    // Getting thy images :
    let cloudinaryResponse;
    try {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    } catch (uploadError) {
      return res
        .status(500)
        .json({ message: "Image upload failed", error: uploadError.message });
    }

    const newProduct = await Product.create({
      name,
      price,
      description,
      category,
      image: cloudinaryResponse.secure_url || "",
    });
    res.status(201).json({
      product: newProduct,
      message: "Product created successfully",
    });
  } catch (error) {
    console.log("Error in createProduct CONTROLLER");
    return res.status(500).json({ error: error.message });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params._id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // also delete the product from the ID :=>
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0]; // gets the ID of the current image :
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from the cloudinary.");
      } catch (error) {
        console.log("IMAge deletion failed :", error);
      }
    }
    await Product.findByIdAndDelete(req.params._id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct CONTROLLER");
    return res.status(500).json({ error: error.message });
  }
};
export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]); //  getting Random 3 products :

    // return 3 random products :: 
    res.json({ products });
  } catch (error) {
    console.log("Error in getRecommendedProducts CONTROLLER");
  }
};
export const getProductsByCategory = async (req, res) => {
    try {
        const {category} = req.params;

        // find the products with the category. 
        const products = await Product.find({category});
        res.json({products});
    } catch (error) {
        console.log(firstname, "Error in getProductsByCategory CONTROLLER");
        res.status(500).json({error: error.message});   
    }
};
export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params._id); 
        if(product) {
           product.isFeatured  = !product.isFeatured; // toggle ~ on and off ~
           const updatedProduct = await product.save(); 
           await updateFeaturedProductCache(); 
           res.json({product: updatedProduct});
        }else{
            res.status(404).json({message: "Product not found"});
        }
    } catch (error) {
        console.log("Error in toggleFeaturedProduct CONTROLLER");
        res.status(500).json({error: error.message});
    }
};