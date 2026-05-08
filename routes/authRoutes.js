import express from "express";
import {
  getLogin, postLogin,
  getLogout,
  getRegister, postRegister,
  getVerify2FA, postVerify2FA,
} from "../controllers/authController.js";
import { loginValidation, registerValidation } from "../validators/authValidators.js";

const router = express.Router();

router.get("/login", getLogin);
router.post("/login", loginValidation, postLogin);
router.get("/logout", getLogout);
router.get("/register", getRegister);
router.post("/register", registerValidation, postRegister);
router.get("/verify-2fa", getVerify2FA);
router.post("/verify-2fa", postVerify2FA);

export default router;