import express from "express";
import Coupon from "../model/coupon.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false; // cause Expired:
      await coupon.save();
      return res.status(400).json({ message: "Coupon has expired !! " });
    }

    // Coupon is valid:
    res.json({
      message: "Coupon is valid",
      discountPercentage: coupon.discountPercentage,
      code: coupon.code
    });
  } catch (error) {
    console.log("Error in validateCoupon CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};
