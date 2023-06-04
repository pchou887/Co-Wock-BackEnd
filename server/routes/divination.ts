import { Router } from "express";
import { getDivinationResult ,insertUserCoupon ,getDivinationResultForIOS} from "../controllers/divination.js";
import authenticate from "../middleware/authenticate.js"

const router = Router();

router.route("/front/divination").post([authenticate,getDivinationResult]);

router.route("/ios/divination").post([authenticate,getDivinationResultForIOS]);

router.route("/v1/coupon").post([authenticate, insertUserCoupon]);

router.route("/coupon").post(insertUserCoupon);

export default router;
