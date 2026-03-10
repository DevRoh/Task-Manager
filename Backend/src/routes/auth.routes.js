import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import { userRegistrationValidator } from "../validators/index.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/register", userRegistrationValidator(), validate, registerUser);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.get("/logout", isLoggedIn, logoutUser);
router.get("/verify/:token", resendVerificationEmail);
router.get("/profile", isLoggedIn, getCurrentUser);
router.post("/forgot-password", forgotPasswordRequest);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", isLoggedIn, changeCurrentPassword);
router.post("/refresh-token", refreshAccessToken);

export default router;
