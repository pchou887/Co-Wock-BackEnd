import { Request, Response } from "express";
import { ValidationError } from "../utils/errorHandler.js";

import * as productModel from "../models/product.js";
import * as productImageModel from "../models/productImage.js";
import * as productVariantModel from "../models/productVariant.js";

import { mapId, mapImages, mapVariants } from "./product.js";

export async function chatboxProductForFront(req: Request, res: Response) {
  try {
    const { message } = req.body.data;

    const productsData =
      message === "dress" ||
      message === "jeans" ||
      message === "new" ||
      message === "hots"
        ? await productModel.getChatboxProductForFront(message)
        : false;
    if (!productsData) throw new ValidationError("message wrong");

    const productIds = productsData?.map?.(mapId);
    const images = await productImageModel.getProductImages(productIds);
    const imagesObj = productImageModel.groupImages(images);
    const products = productsData.map(mapImages(imagesObj));
    res.status(200).json({ data: products[0] });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
    }
    res.status(500).json({ errors: "something wrong" });
  }
}

export async function chatboxProductForiOS(req: Request, res: Response) {
  try {
    const { message } = req.body.data;

    const productsData =
      message === "dress" ||
      message === "jeans" ||
      message === "new" ||
      message === "hots"
        ? await productModel.getChatboxProductForiOS(message)
        : false;
    if (!productsData) throw new ValidationError("message wrong");

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
      data: products[0],
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
    }
    res.status(500).json({ errors: "something wrong" });
  }
}
