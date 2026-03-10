import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  sendMail,
  emailVerificationMailGenContent,
  forgotPasswordMailGenContent,
} from "../utils/mail.js";

import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role, fullname } = req.body;

  if (!email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exist");
  }
  const user = await User.create({
    username,
    email,
    password,
    fullname,
  });
  console.log(user);

  // Generating temporary token
  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save();

  const verificationURL = `${process.env.BASE_URL}/api/v1/user/verify/${unHashedToken}`;

  await sendMail({
    email: user.email,
    subject: "Veify your email",
    mailGenContent: emailVerificationMailGenContent(username, verificationURL),
  });

  res
    .status(200)
    .json({ message: "User Registered Successfully", success: true });
});

const verifyEmail = asyncHandler(async (req, res) => {
  
});

const loginUser = asyncHandler(async (req, res) => {});

const logoutUser = asyncHandler(async (req, res) => {});

const resendVerificationEmail = asyncHandler(async (req, res) => {});

const refreshAccessToken = asyncHandler(async (req, res) => {});

const forgotPasswordRequest = asyncHandler(async (req, res) => {});

const changeCurrentPassword = asyncHandler(async (req, res) => {});

const getCurrentUser = asyncHandler(async (req, res) => {});

export { registerUser, verifyEmail };
