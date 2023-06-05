import { Router } from "express";
import { checkout ,getUserCoupons} from "../controllers/order.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.route("/order/checkout").post(authenticate, checkout);

router.route("/cart/coupon").get(authenticate,getUserCoupons);

export default router;
