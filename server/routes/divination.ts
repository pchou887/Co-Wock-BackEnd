import { Router } from "express";
import {
  getDivinationResult,
  insertUserCoupon,
  getDivinationResultForIOS,
} from "../controllers/divination.js";
import authenticate from "../middleware/authenticate.js";
import tokenTranslate from "../middleware/tokentranslate.js";

const router = Router();

router.route("/front/divination").post([tokenTranslate, getDivinationResult]);

router
  .route("/ios/divination")
  .post([tokenTranslate, getDivinationResultForIOS]);

router.route("/coupon").post([authenticate, insertUserCoupon]);

export default router;
