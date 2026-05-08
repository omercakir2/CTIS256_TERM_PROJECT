import { body } from "express-validator";

export const registerValidation = [
  body("email").isEmail().withMessage("Invalid email format!"),
  body("password").notEmpty().withMessage("Password cannot be empty."),
  body("name").notEmpty().withMessage("Name cannot be empty"),
  body("city").notEmpty().withMessage("City cannot be empty"),
  body("district").notEmpty().withMessage("District cannot be empty"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format!"),
  body("password").notEmpty().withMessage("Password cannot be empty."),
];

export const profileValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name cannot be empty.")
    .isLength({ max: 20 }).withMessage("Name cannot be longer than 20 characters."),

  body("city")
    .trim()
    .notEmpty().withMessage("City cannot be empty.")
    .isLength({ max: 20 }).withMessage("City cannot be longer than 20 characters."),

  body("district")
    .trim()
    .notEmpty().withMessage("District cannot be empty.")
    .isLength({ max: 20 }).withMessage("District cannot be longer than 20 characters."),
];