import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const isLoggedIn = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    console.log("Access Token Found: ", accessToken ? "Yes" : "No");
    if (!accessToken) {
      console.log("No token");
      throw new ApiError(400, "Authentication failed");
    }
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    console.log("decoded data: ",decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Auth middleware failure");
    res.status(400).json({ message: "Internal Server Error", success: false });
  }
};


