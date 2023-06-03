import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import { z } from "zod";
import pool from "./databasePool.js";

export async function insertUserCoupon(user_id:string, coupon_id:string) {
  try {
    const results = await pool.query(`
      INSERT INTO user_coupon (user_id, coupon_id)
      VALUES (?, ?)
    `, [user_id, coupon_id]);
    return results; // Return the results of the query if successful
  } catch (error) {
    console.error(error);
    throw error; // Throw the error to handle it elsewhere if there was a failure
  }
  }


  export async function getRandomCoupon() {
    const [results] = await pool.query(
      `SELECT *
      FROM coupons
      ORDER BY RAND()
      LIMIT 1;`
    );
    return results;
  }

export async function getRandomStraw() {
  const [results] = await pool.query(
    `SELECT *
    FROM straws_story
    ORDER BY RAND()
    LIMIT 1;`
  )
  return results;
}

export async function checkRecord(user_id:string) {
  const results = await pool.query(`SELECT expire_time FROM week_straws WHERE user_id = ?`, [user_id]);
  return results; // Return the results of the query if successful
}