import { Request, Response, NextFunction } from "express";
import * as productModel from "../models/product.js";
import * as productImageModel from "../models/productImage.js";
import * as productVariantModel from "../models/productVariant.js";
import * as userModel from "../models/user.js";
import * as couponModel from "../models/coupon.js";
import { mapId, mapImages, mapVariants } from "../controllers/product.js";

export async function getDivinationResult(req: Request, res: Response) {
  try {
    const { birthday, sign, gender, color } = req.body.data;
    const userId = res.locals?.userId ?? false;
    if (userId) {
      const check: any = await userModel.checkUserDetails(
        userId,
        birthday,
        sign,
        gender
      );
      if (!check) {
        await userModel.insertUserDetails(userId, birthday, sign, gender);
      }
    }
    const category = gender;
    const limit = 6;
    const straws = await couponModel.getRandomStraw();
    const couponRows = await couponModel.getRandomCoupon();
    const coupon = couponRows[0];
    const products = await productModel.getProductsByColor({
      limit,
      category,
      color,
    });
    const formattedProducts = products.map((element) => ({
      id: element.id,
      main_image: `https://hyperushle.com${element.path}`,
      title: element.title,
      price: element.price,
    }));
    res.status(200).json({
      data: {
        straws_story: straws[0],
        coupon_id: coupon.id,
        coupon_name: coupon.type,
        description: coupon.description,
        discount: coupon.discount,
        valid_date: coupon.expire_time,
        products: formattedProducts,
      },
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ errors: err instanceof Error ? err.message : String(err) });
  }
}

export async function getDivinationResultForIOS(req: Request, res: Response) {
  try {
    const { birthday, sign, gender, color } = req.body.data;
    const userId = res.locals?.userId ?? false;
    if (userId) {
      const check: any = await userModel.checkUserDetails(
        userId,
        birthday,
        sign,
        gender
      );
      if (!check) {
        await userModel.insertUserDetails(userId, birthday, sign, gender);
      }
    }
    const category = gender;
    const limit = 6;
    const straws = await couponModel.getRandomStraw();
    const couponRows = await couponModel.getRandomCoupon();
    const coupon = couponRows[0];
    const productsData = await productModel.getProductsByColorForIOS({
      limit,
      category,
      color,
    });
    const productIds = productsData?.map?.(mapId);
    const [images, variants] = await Promise.all([
      productImageModel.getProductImages(productIds),
      productVariantModel.getProductVariants(productIds),
    ]);
    const imagesObj = productImageModel.groupImages(images);
    const variantsObj = productVariantModel.groupVariants(variants);
    const products = productsData
      .map(mapImages(imagesObj))
      .map(mapVariants(variantsObj));

    res.status(200).json({
      data: {
        straws_story: straws[0],
        coupon_id: coupon.id,
        coupon_name: coupon.type,
        description: coupon.description,
        discount: coupon.discount,
        valid_date: coupon.expire_time,
        products,
      },
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ errors: err instanceof Error ? err.message : String(err) });
  }
}

export async function insertUserCoupon(req: Request, res: Response) {
  try {
    const { coupon_id } = req.body.data;
    const userId = res.locals.userId;
    const today = new Date();

    const currentDayOfWeek = today.getDay();
    const sundayDate = new Date(today);
    sundayDate.setDate(today.getDate() - currentDayOfWeek + 7);
    const year = sundayDate.getFullYear();
    const month = sundayDate.getMonth() + 1;
    const date = sundayDate.getDate();
    const expireTime = `${year}-${month}-${date}`;

    const receiveRecord: any = await couponModel.checkRecord(userId);
    const record = receiveRecord[0];
    if (!record) {
      await couponModel.createRecord(userId, expireTime);
      await couponModel.insertUserCoupon(userId, coupon_id);
      res.status(200).send("領取成功");
      return;
    }
    const date1 = new Date(expireTime);
    const date2 = new Date(record.expire_time);
    if (date1.getTime() >= date2.getTime()) {
      res.status(403).json({ errors: "這週已領取過" });
      return;
    }

    await couponModel.updateRecord(userId, expireTime);
    await couponModel.insertUserCoupon(userId, coupon_id);

    res.status(200).send("領取成功");
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
      return;
    }
    res.status(500).json({ errors: "insert coupon failed" });
  }
}
