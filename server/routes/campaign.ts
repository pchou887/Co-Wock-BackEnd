import { Router } from "express";
import {
  getCampaigns,
  checkProductExist,
  createCampaign,
  getCampaignsForIOS,
} from "../controllers/campaign.js";
import { uploadToDisk } from "../middleware/multer.js";

const router = Router();

router.route("/marketing/campaigns").get(getCampaigns);

router
  .route("/marketing/campaigns")
  .post(
    uploadToDisk.single("campaign_picture"),
    checkProductExist,
    createCampaign
  );


  router.route("/marketing/hots").get(getCampaignsForIOS);


export default router;
