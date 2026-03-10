import { Router } from "express";
import { registerUser, verifyEmail } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import { userRegistrationValidator } from "../validators/index.js";

const router = Router()

router.post('/register',userRegistrationValidator(),validate, registerUser)
router.post('/verify/:token',verifyEmail)



export default router