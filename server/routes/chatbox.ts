import { Router } from "express";
import {
  chatboxProductForFront,
  chatboxProductForiOS,
} from "../controllers/chatbox.js";

const router = Router();

router.route("/front/chatbox").post(chatboxProductForFront);
router.route("/ios/chatbox").post(chatboxProductForiOS);

export default router;
