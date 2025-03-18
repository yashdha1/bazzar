import Product from "../model/product.model.js";
export const getAllProducts = async (req, res) => {
    try {
      const productIds = req.user.cartItems.map(item => item.id);
      const products = await Product.find({ _id: { $in: productIds } });
      // calculate all the produts from the IDs in the CART: 
      const cartItems = products.map(product => {
        const item = req.user.cartItems.find(cartItem => cartItem.id.toString() === product._id.toString() ) ;
        return { ...product.toObject() , quantity: item.quantity }
      })

      res.json(cartItems); 
    } catch (error) {
        console.log("Error in getAllProducts CONTROLLER");
       res.status(500).json({ error: error.message });
    }   
};
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    console.log('A point')
    const existingItem = user.cartItems.find((item) => item.id === productId);
    console.log('B point')
    if (existingItem) {
      // if item already exists in the cart : Increment the quantity...
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ id: productId, quantity: 1 }); // when you first create a PRODUCT...
    }

    await user.save(); // save the user to the DB :
    
    console.log('C point')
    console.log("Product added to cart successfully");
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};
export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }

    await user.save(); // save the user back to DB:
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in removeAllFromCart CONTROLLER. ");
    res.status(500).json({ error: error.message });
  }
};
export const updateQuantity = async (req, res) => {
  try {
    const { id: productId, quantity } = req.params;
    console.log(productId, quantity);
    const user = req.user;

    // check if Item Exists : 
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
        if(quantity === 0) {
            // if Quantity reaches 0 : Just delete the Product; 
            user.cartItems = user.cartItems.filter((item) => item.id !== productId); 
            user.save();
            res.json(user.cartItems);
        }else{
            existingItem.quantity = quantity ; 
        }
        await user.save(); 
        return res.json(user.cartItems);
    }else{
        res.status(404).json({message: "Product not found"});
    }
  } catch (error) {
    console.log("Error in updateQuantity CONTROLLER");
  }
};