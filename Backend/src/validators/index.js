import { body } from "express-validator";

const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("username is required")
      .isLength({ min: 3 })
      .withMessage("Minimum username length should be 3")
      .isLength({ max: 13 })
      .withMessage("Maximum username length is 13"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").isEmail().withMessage("Email is not valid"),
    body("password")
      .notEmpty()
      .withMessage("password cant be emapty")
      .isStrongPassword()
      .withMessage("use a strong password"),
  ];
};

export { userRegistrationValidator, userLoginValidator };
