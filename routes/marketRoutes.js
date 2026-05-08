import express from "express";
import {
  getDashboard,
  getAddProduct,
  getEditProduct,
  postAddProduct,
  postEditProduct,
  deleteProduct,
} from "../controllers/marketController.js";
import { getMarketProfile, postMarketProfile } from "../controllers/profileController.js";
import { profileValidation } from "../validators/authValidators.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/addproduct", getAddProduct);
router.post("/addproduct", upload.single("product_image"), postAddProduct);
router.get("/product/edit/:proid", getEditProduct);
router.post("/editproduct/:proid", upload.single("product_image"), postEditProduct);
router.get("/product/delete/:proid", deleteProduct);
router.get("/profile", getMarketProfile);
router.post("/profile", profileValidation, postMarketProfile);

export default router;