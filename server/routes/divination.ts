import { Router } from "express";
import {
  getDivinationResult,
  insertUserCoupon,
  getDivinationResultForIOS,
} from "../controllers/divination.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.route("/front/divination").post(getDivinationResult);

router.route("/ios/divination").post(getDivinationResultForIOS);

router.route("/coupon").post([authenticate, insertUserCoupon]);

export default router;
