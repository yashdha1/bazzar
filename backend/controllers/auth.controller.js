import express from "express";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

// Endpoints :
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).send("All fields are required.");

    const userExists = await User.findOne({ email }); // cheack if user already exists!!
    if (userExists) {
      return res.status(400).send("User already exists!");
    }
    // create a new User in the DB.
    const newUser = await User.create({ username, email, password });

    // Authentication :
    const { accessToken, refreshToken } = generateTokens(newUser._id); // after user is created :
    await storeTokens(newUser._id, refreshToken); // storing Tokens in redis Database :
    setCookies(res, accessToken, refreshToken); // setup cookies So we can access it later...
    console.log("🚀 Setting Cookies: ", { accessToken, refreshToken });

    return res
      .status(201)
      .json({ user: newUser, message: "User created successfully" });
  } catch (error) {
    console.log("Error in SIGNUP CONTROLLER");
    return res.status(500).json({ error: error.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).send("All fields are required.");
    const user = await User.findOne({ email }); // find user in the DATABASE :

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id); // after user is created :
      await storeTokens(user._id, refreshToken); // storing Tokens in redis Database :
      console.log("🚀 Setting Cookies: ", { accessToken, refreshToken });
      setCookies(res, accessToken, refreshToken); // setup cookies So we can access it later...
      console.log("🚀 Setting Cookies: ", { accessToken, refreshToken });

      res.json({ user, message: "User logged in successfully" }); // send user as the respose:
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.log("Error in LOGIN CONTROLLER");
    return res.status(500).json({ error: error.message });
  }
};
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // collect this token from cookies.
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await redis.del(`Refresh Token: ${decoded.userId}`); // delete the current instance for this shit...
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "User logged out successfully" });
  } catch (error) {
    console.log("Error in logout CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};
export const refreshTokens = async (req, res) => {
  // refreshToken : refreshes the access token so that the user can access the account, even after the timeout.
  // or the previous cookie has expiered :
  try {
    const refreshToken = req.cookies.refreshToken; // Get the refresh token from cookies
    if (!refreshToken) {
      return res.json({ message: "User logged out successfully" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // debugg :
    console.log("Refresh Token from Cookie:", refreshToken);
    const getStoredToken = await redis.get(`Refresh Token: ${decoded.userId}`);
    console.log("Stored Refresh Token in Redis:", getStoredToken);

    if (getStoredToken !== refreshToken) {
      console.log("Token mismatch! Unauthorized access.");
      return res
        .status(401)
        .json({ error: " Unauthorized: Invalid refresh token... " });
    }

    // else generate the new refresh TOKEN...
    // Generate a new access token
    const refreshedAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIREIN }
    );
    // Set the new access token in cookies
    res.cookie("accessToken", refreshedAccessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: "Token refreshed successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server ERROR. LOGOUT AND TRY AGAIN." });
  }
};
export const getProfile = async (req, res) => {
  try {
    res.json({ user: req.user }); // directly user is in the req body:
  } catch (error) {
    console.log("Error in getProfile CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};

// Helper Functions :
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIREIN,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIREIN,
  });

  return { accessToken, refreshToken };
};
const storeTokens = async (userId, refreshToken) => {
  await redis.set(
    `Refresh Token: ${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ Only secure in production
    sameSite: "lax", // ✅ Allows cookies in cross-origin requests
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ Only secure in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log("fuck Cookies Set:", {
    accessToken,
    refreshToken,
  });
};
