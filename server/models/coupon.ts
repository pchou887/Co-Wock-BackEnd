import { z } from "zod";
import pool from "./databasePool.js";

export async function insertUserCoupon(user_id: number, coupon_id: number) {
  try {
    const [results] = await pool.query(
      `
      INSERT INTO user_coupons (user_id, coupon_id)
      VALUES (?, ?)
    `,
      [user_id, coupon_id]
    );
    return results;
  } catch (err) {
    throw Error("優惠卷已領取過");
  }
}
const RandomCouponSchema = z.object({
  id: z.number(),
  type: z.string(),
  description: z.string(),
  discount: z.number(),
  expire_time: z.date(),
});

export async function getRandomCoupon() {
  const results = await pool.query(
    `SELECT *
    FROM coupons
    ORDER BY RAND()
    LIMIT 1;`
  );
  const coupon = z.array(RandomCouponSchema).parse(results[0]);
  return coupon;
}

const StrawSchema = z.object({
  type: z.string(),
  story: z.string(),
});

export async function getRandomStraw() {
  const results = await pool.query(
    `SELECT *
    FROM straws_story
    ORDER BY RAND()
    LIMIT 1;`
  );
  const straw = z.array(StrawSchema).parse(results[0]);

  return straw;
}

export async function getCoupon(coupon_id: number) {
  const [results] = await pool.query(`SELECT * FROM coupons WHERE id = ?`, [
    coupon_id,
  ]);
  const coupon = z.array(RandomCouponSchema).parse(results);
  return coupon[0].discount;
}

const checkCouponSchema = z.object({
  user_id: z.number(),
  coupon_id: z.number(),
  used: z.number(),
});

export async function checkCoupon(user_id: number, coupon_id: number) {
  const [results] = await pool.query(
    `SELECT * FROM user_coupons WHERE user_id = ?`,
    [user_id]
  );
  const user_coupon = z.array(checkCouponSchema).parse(results);
  const result = user_coupon.filter((ele) => ele.coupon_id === coupon_id);
  return result[0] ? result[0].used : true;
}

export async function UseCoupon(coupon_id: number) {
  const [results] = await pool.query(
    `UPDATE user_coupons SET used = true WHERE coupon_id = ?`,
    [coupon_id]
  );
  return results;
}

export async function checkRecord(user_id: number) {
  const [results] = await pool.query(
    `SELECT expire_time FROM week_straws WHERE user_id = ?`,
    [user_id]
  );
  return results;
}

export async function createRecord(user_id: number, expireTime: string) {
  const [results] = await pool.query(
    `INSERT INTO  week_straws (user_id, expire_time) VALUES(?,?)`,
    [user_id, expireTime]
  );
  return results;
}

export async function updateRecord(user_id: number, expireTime: string) {
  const [results] = await pool.query(
    `UPDATE week_straws SET expire_time="${expireTime}" WHERE user_id=${user_id}`
  );
  return results;
}

const UserCouponsSchema = z.object({
  id: z.number(),
  type: z.string(),
  description: z.string(),
  discount: z.number(),
  expire_time: z.date(),
  used: z.number(),
});

export async function getUserCoupons(user_id: number) {
  const results = await pool.query(
    `
    SELECT c.* ,uc.used
    From user_coupons AS uc
    JOIN coupons AS c ON c.id = uc.coupon_id
    WHERE user_id =?
    `,
    [user_id]
  );
  const coupons = z.array(UserCouponsSchema).parse(results[0]);
  return coupons;
}

export async function deleteUserCoupon() {
  const weekRecord = pool.query("DELETE FROM week_straws WHERE user_id = 25");
  const userCoupons = pool.query("DELETE FROM user_coupons WHERE user_id =25");
  await Promise.all([weekRecord, userCoupons]);
}
