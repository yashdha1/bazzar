import express from 'express' ; 
import dotenv from 'dotenv' ; 
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.route.js'
import productRoutes from './routes/product.route.js'
import cartRoutes from './routes/cart.route.js'
import couponRoutes from './routes/coupon.route.js'
import paymentRoutes from './routes/payment.route.js' 
import analyticsRoutes from './routes/analytics.route.js'

import { connectDB } from './lib/db.js';


dotenv.config() 
const app = express() 

// vars 
const PORT = process.env.PORT || 5000

// middleware 
app.use(express.json({ limit: '10mb'}) )// allows express formatting: JSON data. 
app.use(cookieParser()) // allows express formatting: Cookies.

// Routes 
app.use('/api/v1/auth',  authRoutes )
app.use('/api/v1/product',  productRoutes )
app.use('/api/v1/cart',  cartRoutes )
app.use('/api/v1/coupons',  couponRoutes )
app.use('/api/v1/payments',  paymentRoutes )
app.use('/api/v1/analytic',  analyticsRoutes )

// endpoints...
app.listen(PORT, ()=>{ 
    console.log("Server has started successfully!!! at http://localhost:" + PORT); 
    connectDB() 
})