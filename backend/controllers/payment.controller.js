import Coupon from "../model/coupon.model.js";
import { stripe } from "../lib/stripe.js"; 
import Order from "../model/order.model.js"; 

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    // 1. user should be sending us the products and the coupon...
    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: "Please provide a valid products array." });
    }

    //2.  calc price of all products in the product array...
    let totalAmt = 0;
    const lineItems = products.map((product) => {
      const amt = Math.round(product.price * 100); // do this cause the stripe wants shit in the Cents format so: $1 * 100 = 100cents.
      totalAmt += amt * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            image: product.image,
          },
          unit_amount: amt,
        },
      };
    });

    // 3. if coupon is given, check if it is valid and recalc the totalAMT:
    let coupon = null;
    if (couponCode) {
      // if user has a Coupon Code :
      coupon = await Coupon.findOne({
        code: couponCode,
        usedId: res.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmt -= Math.round(totalAmt * (coupon.discountPercentage / 100)); // -ve the percentage of offer the user will have...
      }
    }

    // Finally lets make a session :
    // -----------------------------------------------------------------------------
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment", // one time payment
      success_url: `${process.env.CLIENT_URL}/purchase_success?session_id={CHECKOUT_SESSION_ID}`, // if sucess is there so this....
      cancel_url: `${process.env.CLIENT_URL}/purchase_cancel`, // if sucess is there so this.... make thy page
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: res.user._id.toString(),
        couponCode: couponCode || null,
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            name: p.name,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmt >= 20000) {
      // if 200$ worth of shit is purchased...
      await createNewCoupon(res.user._id);
    }
    res.status(200).json({ sessionId: session.id, totalAmt: totalAmt / 100 }); // div by 100 cause of dollers...
  } catch (error) {
    console.log("Unable to create session... ");
    res.status(500).json({ error: error.message });
  }
};
export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status == "paid") {
      // if paid first disable the coupon :
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            // update the Coupon to inactive Status:
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      // Create A New Order:
      // get the products from the Metadata: 
      const products = JSON.parse(session.metadata.products);
      const newOrder = await Order.create({
        user: session.metadata.userId,
        products : products.map(product => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount : session.amount_total / 100, // convert cents to dollars  
        stripeSessionId: sessionId,
       })
      await newOrder.save();
      res.status(200).json({ success: true , message: "Order Placed Successfully.", orderId: newOrder._id });
    }
  } catch (error) {
    console.log("Error in checkoutSuccess CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};

// UTILITIES FUNCTIONS :
const createStripeCoupon = async (discountPercentage) => {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
};
const createNewCoupon = async (userId) => {
  // creating new Coupon in the DB :
  const newCoupon = await Coupon.create({
    code: "GIFT" + Math.random().toString(36).slice(2),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now...
    isActive: true,
    userId: userId,
  });
  await newCoupon.save(); // save new Coupon to the database ...
  return newCoupon;
};
