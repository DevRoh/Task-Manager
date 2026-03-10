import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  sendMail,
  emailVerificationMailGenContent,
  forgotPasswordMailGenContent,
} from "../utils/mail.js";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken'

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
  const { token } = req.params;
  console.log(`Token from params: ${token}`);
  if (!token) {
    throw new ApiError(400, "Invalid Token");
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  console.log(`Hashed token: ${hashedToken}`);
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  });
  if (!user) {
    throw new ApiError(400, "User doesn't exist");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  res
    .status(200)
    .json({ message: "Email verified successfully", success: true });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Enter both fields");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not registered, Please register first");
  }
  const isMatched = await user.isPasswordCorrected(password);
  console.log(isMatched);

  if (!isMatched) {
    throw new ApiError(400, "Invalid Credentials");
  }
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  };
  user.refreshToken = refreshToken;
  await user.save();
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .json({ message: "Login SuccessFully", success: true });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("accessToken", "", { expires: new Date(0) });
  res.cookie("refreshToken", "", { expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully", success: true });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }
  const { _id } = req.user;

  const user = await User.findById(_id)
    .select("-password")
    .select("-refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json({
    success: true,
    user,
  });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email });
  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.emailVerificationToken = unHashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save();

  const verificationURL = `${process.env.BASE_URL}/api/v1/user/verify/${unHashedToken}`;

  await sendMail({
    email: user.email,
    subject: "Veify your email",
    mailGenContent: emailVerificationMailGenContent(
      user.username,
      verificationURL,
    ),
  });

  res.status(200).json({
    success: true,
    message: "Verification email sent again",
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token is missing");
  }
  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh Token mismatch");
  }
  const newAccessToken = user.generateAccessToken();
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  };
  return res
    .cookie("accessToken", newAccessToken, cookieOptions)
    .status(200)
    .json({ message: "new Access Token generated", success: true });
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email });

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save();

  const forgotPasswordURL = `${process.env.BASE_URL}/api/v1/user/reset-password/${unHashedToken}`;
  await sendMail({
    email: user.email,
    subject: "Click here to reset your password",
    mailGenContent: forgotPasswordMailGenContent(
      user.username,
      forgotPasswordURL,
    ),
  });

  res
    .status(200)
    .json({ message: "Forgot password mail sent successfully", success: true });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  if (!token) {
    throw new ApiError(400, "Token is invalid");
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    // forgotPasswordExpiry: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user.refreshToken = undefined;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }
  const { _id } = req.user;
  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not available");
  }
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Fill the required fields");
  }
  const isMatched = await user.isPasswordCorrected(oldPassword);
  if (!isMatched) {
    throw new ApiError(400, "Old password is invalid");
  }

  user.password = newPassword;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  resendVerificationEmail,
  getCurrentUser,
  forgotPasswordRequest,
  resetPassword,
  changeCurrentPassword,
  refreshAccessToken,
};
