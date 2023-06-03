import { Request, Response, NextFunction } from "express";
import * as productModel from "../models/product.js";
import * as productImageModel from "../models/productImage.js";
import * as productVariantModel from "../models/productVariant.js";
import  * as couponModel from "../models/coupon.js"


export async function getDivinationResult(req: Request, res: Response) {
    try{
        const color  = "#FFFFFF";
        const category = "women";
        const paging = 6;
        const straws = await couponModel.getRandomStraw();
        const couponRows :any= await couponModel.getRandomCoupon();
        const coupon = couponRows[0];
        const products = await productModel.getProductsByColor({paging,category,color});
        const formattedProducts = products.map((element) => ({
            main_image: element.path,
            title: element.title,
            price: element.price,
            product_url: `/product.html?id=${element.id}`
        }));
        res.status(200).json({data:{
            straws_story:straws,
            coupon_id: coupon.id,
            coupon_name: coupon.type,
            description: coupon.description,
            discount: coupon.discount,
            valid_date: coupon.expire_time,
            products:formattedProducts
        }})
    }catch(err){
        console.log(err)
        res.status(500).json({ errors: err instanceof Error ? err.message : String(err) });
    }
    
}

function mapId<Item extends { id: number }>(item: Item) {
    return item.id;
  }
  
  function mapImages(imagesObj: {
    [productId: string]: { main_image: string; images: string[] };
  }) {
    return <Product extends { id: number }>(product: Product) => ({
      ...product,
      main_image: `${imagesObj[product.id]?.main_image}` ?? "",
      images: imagesObj[product.id]?.images?.map?.((image) => `${image}`) ?? [],
    });
  }
  
  function mapVariants(variantsObj: {
    [productId: string]: {
      variants: {
        color_code: string;
        size: string;
        stock: number;
      }[];
      sizes: Set<string>;
      colorsMap: { [colorCode: string]: string };
    };
  }) {
    return <Product extends { id: number }>(product: Product) => ({
      ...product,
      ...variantsObj[product.id],
      sizes: Array.from(variantsObj[product.id].sizes),
      colors: Object.entries(variantsObj[product.id].colorsMap).map(
        ([key, value]) => ({
          code: key,
          name: value,
        })
      ),
    });
  }

export async function getDivinationResultForIOS(req: Request, res: Response) {
    try{
        const { color } = req.body;
        const category = req.body.gender;
        const paging = 6;
        const straws = await couponModel.getRandomStraw();
        const couponRows :any= await couponModel.getRandomCoupon();
        const coupon = couponRows[0];
        const productsData = await productModel.getProductsByColorForIOS({paging,category,color});
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
        
          res.status(200).json({data:{
            straws_story:straws,
            coupon_id: coupon.id,
            coupon_name: coupon.type,
            description: coupon.description,
            discount: coupon.discount,
            valid_date: coupon.expire_time,
            products,
        }})
    }catch(err){
        res.status(500).json({ errors: "insert coupon failed" });
    }
}

export async function insertUserCoupon(req: Request, res: Response) {
    try{
        const { coupon_id } = req.body;
        const user_id = res.locals.userId;

        //判斷這週有沒有領取紀錄
        const receiveRecord = await couponModel.checkRecord(user_id);
        if(receiveRecord){
            res.status(403).json({ errors: "這週已領取過"});
            return;
        }

        //insert coupon & create record
        // const record = await createRecord();
        const add = await insertUserCoupon(user_id,coupon_id);
        res.status(200).send("領取成功" );
    } catch(err){
        if (err instanceof Error) {
            res.status(400).json({ errors: err.message });
            return;
        }
          res.status(500).json({ errors: "insert coupon failed" });
    }
}
