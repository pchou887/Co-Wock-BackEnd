import { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2/promise";
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

export async function getRandomStraw() {
  const [results] = await pool.query(
    `SELECT *
    FROM straws_story
    ORDER BY RAND()
    LIMIT 1;`
  );
  return results;
}

export async function getCoupon(coupon_id: number) {
  const [results] = await pool.query(
    `SELECT * FROM coupon WHERE coupon_id = ?`,
    [coupon_id]
  );
  const coupon = z.array(RandomCouponSchema).parse(results);
  return coupon[0].discount;
}

const checkCouponSchema = z.object({
  user_id: z.number(),
  coupon_id: z.number(),
  used: z.boolean(),
});

export async function checkCoupon(user_id: number, coupon_id: number) {
  const [results] = await pool.query(
    `SELECT * FROM user_coupon WHERE user_id = ?`,
    [user_id]
  );
  const user_coupon = z.array(checkCouponSchema).parse(results);
  const result = user_coupon.filter((ele) => ele.coupon_id === coupon_id);

  return result[0] ? result[0].used : true;
}

export async function checkRecord(user_id: number) {
  const [results] = await pool.query(
    `SELECT expire_time FROM week_straws WHERE user_id = ?`,
    [user_id]
  );
  return results;
}

export async function createRecord(user_id: number) {
  const today = new Date();

  // 取得當前星期幾（0 表示星期日，1 表示星期一，以此類推）
  const currentDayOfWeek = today.getDay();

  // 計算當週的星期日日期
  const sundayDate = new Date(today);
  sundayDate.setDate(today.getDate() - currentDayOfWeek + 7);

  // 取得年、月、日
  const year = sundayDate.getFullYear();
  // JavaScript 的月份是以 0 到 11 來表示，所以要加 1
  const month = sundayDate.getMonth() + 1;
  const date = sundayDate.getDate();

  // 输出结果
  const expireTime = `${year}-${month}-${date}`;
  console.log(`當週星期日為：${year}-${month}-${date}`);
  const [results] = await pool.query(
    `INSERT INTO  week_straws (user_id, expire_time) VALUES(?,?)`,
    [user_id, expireTime]
  );
  return results;
}

export async function updateRecord(user_id: number, expireTime: string) {
  const [results] = await pool.query(
    `UPDATE week_straws set expire_time="${expireTime}" WHERE user_id=${expireTime}`
  );
  return results;
}
