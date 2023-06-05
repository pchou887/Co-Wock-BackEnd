import { ResultSetHeader } from "mysql2";
import { number, z } from "zod";
import pool from "./databasePool.js";

/*
  id bigint unsigned NOT NULL AUTO_INCREMENT
  category enum
  title varchar(255) NOT NULL
  description varchar(255) NOT NULL
  price int unsigned NOT NULL
  texture varchar(127) NOT NULL
  wash varchar(127) NOT NULL
  place varchar(127) NOT NULL
  note varchar(127) NOT NULL
  story varchar(127) NOT NULL
  variants
  images
**/

export const CategorySchema = z.enum(["men", "women", "accessories"]);

const ProductSchema = z.object({
  id: z.number(),
  category: CategorySchema,
  title: z.string(),
  description: z.string(),
  price: z.number(),
  texture: z.string(),
  wash: z.string(),
  place: z.string(),
  note: z.string(),
  story: z.string(),
});

export const PAGE_COUNT = 6;
export async function getProducts({
  paging = 0,
  category,
}: {
  paging: number;
  category: string;
}) {
  const results = await pool.query(
    `
    SELECT * FROM products
    ${
      CategorySchema.safeParse(category).success
        ? `WHERE category = "${category}"`
        : ""
    }
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `,
    [PAGE_COUNT, paging * PAGE_COUNT]
  );
  const products = z.array(ProductSchema).parse(results[0]);
  return products;
}

export async function getProduct(id: number) {
  const results = await pool.query(
    `
    SELECT * FROM products
    WHERE id = ?
  `,
    [id]
  );
  const products = z.array(ProductSchema).parse(results[0]);
  return products;
}

export async function searchProducts({
  paging = 0,
  keyword,
}: {
  paging: number;
  keyword: string;
}) {
  const results = await pool.query(
    `
    SELECT * FROM products
    WHERE title LIKE ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `,
    [`%${keyword}%`, PAGE_COUNT, paging * PAGE_COUNT]
  );
  const products = z.array(ProductSchema).parse(results[0]);
  return products;
}

const ProductCountSchema = z.object({
  count: z.number(),
});

type ProductCount = z.infer<typeof ProductCountSchema>;

function instanceOfProductCount(object: any): object is ProductCount {
  return "count" in object;
}

export async function countProducts({
  category,
  keyword,
}: {
  category?: string;
  keyword?: string;
}) {
  const results = await pool.query(
    `
  SELECT COUNT(id) AS count
  FROM products
  ${
    CategorySchema.safeParse(category).success
      ? `WHERE category = "${category}"`
      : ""
  }
  ${typeof keyword === "string" ? `WHERE title LIKE ?` : ""}
`,
    [`%${keyword}%`]
  );
  if (Array.isArray(results[0]) && instanceOfProductCount(results[0][0])) {
    const productCount = ProductCountSchema.parse(results[0][0]);
    return productCount.count;
  }
  return 0;
}

function instanceOfSetHeader(object: any): object is ResultSetHeader {
  return "insertId" in object;
}

export async function createProduct(productData: {
  category: string;
  title: string;
  description: string;
  price: number;
  texture: string;
  wash: string;
  place: string;
  note: string;
  story: string;
}) {
  try {
    const {
      category,
      title,
      description,
      price,
      texture,
      wash,
      place,
      note,
      story,
    } = productData;
    const results = await pool.query(
      `
        INSERT INTO products (category, title, description, price, texture, wash, place, note, story)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [category, title, description, price, texture, wash, place, note, story]
    );
    if (Array.isArray(results) && instanceOfSetHeader(results[0])) {
      return results[0].insertId;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function isProductExist(productId: number) {
  const results = await pool.query(
    `
    SELECT COUNT(id) AS count FROM products
    WHERE id = ?
  `,
    [productId]
  );
  if (Array.isArray(results[0]) && instanceOfProductCount(results[0][0])) {
    const productCount = ProductCountSchema.parse(results[0][0]);
    return productCount.count === 1;
  }
  return false;
}

const PartialProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
});

export async function getProductsByIds(ids: number[]) {
  const results = await pool.query(
    `
    SELECT id, title, price FROM products
    WHERE id IN (?)
  `,
    [ids]
  );
  const products = z.array(PartialProductSchema).parse(results[0]);
  return products;
}

const ProductByColorSchema = z.object({
  id: z.number(),
  title: z.string(),
  path: z.string(),
  price: z.number(),
});

export async function getProductsByColor({
  limit = 0,
  category,
  color,
}: {
  limit: number;
  category: string;
  color: string;
}) {
  const results = await pool.query(
    `
    SELECT DISTINCT p.id,p.title, pm.path, p.price 
    FROM product_variants AS pv
    JOIN products AS p ON pv.product_id = p.id
    JOIN product_images AS pm ON pv.product_id = pm.product_id
    ${
      CategorySchema.safeParse(category).success
        ? `WHERE p.category = "${category}" AND pv.color ="${color}" AND pm.field_name ="main_image"`
        : `WHERE pv.color ="${color}" AND pm.field_name ="main_image"`
    }
    ORDER BY RAND()
    LIMIT ${limit} 
    `
  );
  const products = z.array(ProductByColorSchema).parse(results[0]);
  if (products.length < limit) {
    const limit2 = limit - products.length;
    const results2 = await pool.query(
      `
    SELECT DISTINCT p.id,p.title, pm.path, p.price 
    FROM product_variants AS pv
    JOIN products AS p ON pv.product_id = p.id
    JOIN product_images AS pm ON pv.product_id = pm.product_id
    WHERE pm.field_name ="main_image"
    ORDER BY RAND()
    LIMIT ${limit2}  
    `
    );
    const products2 = z.array(ProductByColorSchema).parse(results2[0]);
    return [...products, ...products2];
  }
  return products;
}

export async function getProductsByColorForIOS({
  limit = 0,
  category,
  color,
}: {
  limit: number;
  category: string;
  color: string;
}) {
  const results = await pool.query(
    `
    SELECT DISTINCT p.*
    FROM product_variants AS pv
    JOIN products AS p ON pv.product_id = p.id
    ${
      CategorySchema.safeParse(category).success
        ? `WHERE p.category = "${category}" AND pv.color ="${color}"`
        : `WHERE pv.color ="${color}"`
    }
    ORDER BY RAND()
    LIMIT ${limit} 
    `
  );
  const products = z.array(ProductSchema).parse(results[0]);
  if (products.length < limit) {
    const limit2 = limit - products.length;
    const results2 = await pool.query(
      `
      SELECT DISTINCT p.*
      FROM product_variants AS pv
      JOIN products AS p ON pv.product_id = p.id
      ORDER BY RAND()
      LIMIT ${limit2} 
      `
    );
    const products2 = z.array(ProductSchema).parse(results2[0]);
    return [...products, ...products2];
  }
  return products;
}

const ChatboxFrontSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  texture: z.string(),
  place: z.string(),
});

export async function getChatboxProductForFront(type: string) {
  const [result] =
    type === "dress" || type === "jeans"
      ? await pool.query(
          `SELECT id, title, description, texture, place 
          FROM products WHERE title LIKE ? ORDER BY RAND() LIMIT 1`,
          [`%${type === "dress" ? "洋裝" : "牛仔褲"}%`]
        )
      : type === "hots"
      ? await pool.query(
          `SELECT id, title, description, texture, place FROM products ORDER BY RAND() LIMIT 1`
        )
      : await pool.query(
          `SELECT id, title, description, texture, place FROM products ORDER BY id DESC LIMIT 1`
        );
  const product = z.array(ChatboxFrontSchema).parse(result);

  return product;
}
export async function getChatboxProductForiOS(type: string) {
  const [result] =
    type === "dress" || type === "jeans"
      ? await pool.query(
          `SELECT * FROM products 
          WHERE title LIKE ? ORDER BY RAND() LIMIT 1`,
          [`%${type === "dress" ? "洋裝" : "牛仔褲"}%`]
        )
      : type === "hots"
      ? await pool.query(`SELECT * FROM products ORDER BY RAND() LIMIT 1`)
      : await pool.query(`SELECT * FROM products ORDER BY id DESC LIMIT 1`);

  const product = z.array(ProductSchema).parse(result);

  return product;
}
