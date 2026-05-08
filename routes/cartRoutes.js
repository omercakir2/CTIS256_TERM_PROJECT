import express from "express";
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/", getCart);
router.get("/add/product/:id", addToCart);
router.post("/update-quantity", updateCartQuantity);
router.delete("/remove/item/:id", removeCartItem);
router.delete("/clear", clearCart);

export default router;