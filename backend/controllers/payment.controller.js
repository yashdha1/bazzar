import Coupon from "../model/coupon.model.js";
import { stripe } from "../lib/stripe.js"; 
import Order from "../model/order.model.js"; 
 
export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
			totalAmount += amount * product.quantity;

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						images: [product.image],
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
			},
		});

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
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
