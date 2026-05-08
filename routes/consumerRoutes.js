import express from "express";
import { getMain, getProductDetail } from "../controllers/consumerController.js";
import { getConsumerProfile, postConsumerProfile } from "../controllers/profileController.js";
import { restrictToRole } from "../middleware/auth.js";
import { profileValidation } from "../validators/authValidators.js";

const router = express.Router();

router.get("/main", getMain);
router.get("/product/:id", restrictToRole("consumer"), getProductDetail);
router.get("/consumer/profile", getConsumerProfile);
router.post("/consumer/profile", profileValidation, postConsumerProfile);

export default router;