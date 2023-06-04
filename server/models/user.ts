import { ResultSetHeader } from "mysql2";
import { z } from "zod";
import pool from "./databasePool.js";

/*
  id bigint unsigned NOT NULL AUTO_INCREMENT
  email varchar(127) NOT NULL UNIQUE
  name varchar(127) NOT NULL
  picture varchar(255)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  providers
**/

function instanceOfSetHeader(object: any): object is ResultSetHeader {
  return "insertId" in object;
}

export async function createUser(
  email: string,
  name: string,
  picture: string = ""
) {
  const results = await pool.query(
    `
    INSERT INTO users (email, name, picture)
    VALUES(?, ?, ?)
  `,
    [email, name, picture]
  );
  if (Array.isArray(results) && instanceOfSetHeader(results[0])) {
    return results[0].insertId;
  }
  throw new Error("create user failed");
}

const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  picture: z.string().nullish(),
});

export async function findUser(email: string) {
  const results = await pool.query(
    `
    SELECT * FROM users
    WHERE email = ?
  `,
    [email]
  );
  const users = z.array(UserSchema).parse(results[0]);
  return users[0];
}

export async function findUserById(id: string) {
  const results = await pool.query(
    `
    SELECT * FROM users
    WHERE id = ?
  `,
    [id]
  );
  const users = z.array(UserSchema).parse(results[0]);
  return users[0];
}

export async function insertUserDetails(user_id:number,birthday:string,sign:string,gender:string) {
  const results = await pool.query(
    `
    INSERT INTO user_details (user_id, birthday, sign,gender)
    VALUES(?, ?, ?, ?)
  `,
    [user_id, birthday, sign,gender]
  );
  
}

// const UserDetailsSchema = z.object({
//   user_id: z.number(),
//   birthday: z.string(),
//   sign: z.string(),    
//   gender:z.string()
// });

export async function checkUserDetails(user_id:number,birthday:string,sign:string,gender:string) {
  const [results] = await pool.query(
    `
    SELECT * FROM user_details
    WHERE user_id = ?
  `,
    [user_id]
  );
  console.log(results)
  // const details = results[0] ? z.array(UserDetailsSchema).parse(results[0]) : [];
  // return details;
  return results
}


export async function updateUserDetails(user_id:number,birthday:string,sign:string,gender:string) {
  const [results] = await pool.query(
    `
    UPDATE user_details SET birthday = ?, sign = ?, gender = ?
    WHERE user_id = ?
    `,
    [birthday, sign, gender, user_id]
  );
  return results
}