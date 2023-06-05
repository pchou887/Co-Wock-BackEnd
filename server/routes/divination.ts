import { Router } from "express";
import {
  getDivinationResult,
  insertUserCoupon,
  getDivinationResultForIOS,
  deleteDivination,
} from "../controllers/divination.js";
import authenticate from "../middleware/authenticate.js";
import tokenTranslate from "../middleware/tokentranslate.js";

const router = Router();

router.route("/front/divination").post([tokenTranslate, getDivinationResult]);

router
  .route("/ios/divination")
  .post([tokenTranslate, getDivinationResultForIOS]);

router.route("/coupon").post([authenticate, insertUserCoupon]);

router.route("/delete/divination").get(deleteDivination);

export default router;
