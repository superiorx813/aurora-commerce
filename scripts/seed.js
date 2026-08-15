require("dotenv").config({ path: ".env.local" });

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Loading database configuration...");

  console.log("Host:", process.env.DB_HOST);
  console.log("User:", process.env.DB_USER);
  console.log("Database:", process.env.DB_NAME);
  console.log(
    "Password loaded:",
    process.env.DB_PASSWORD ? "YES" : "NO"
  );

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aurora_store",
  });

  console.log("MySQL connection: OK");

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const userPassword = await bcrypt.hash("User@123", 10);

  await connection.execute(
    `
    INSERT INTO users
      (name, email, password_hash, role)
    VALUES
      (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      password_hash = VALUES(password_hash),
      role = VALUES(role)
    `,
    [
      "Aurora Administrator",
      "admin@aurora.local",
      adminPassword,
      "ADMIN",
    ]
  );

  await connection.execute(
    `
    INSERT INTO users
      (name, email, password_hash, role)
    VALUES
      (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      password_hash = VALUES(password_hash),
      role = VALUES(role)
    `,
    [
      "Aurora Customer",
      "user@aurora.local",
      userPassword,
      "CUSTOMER",
    ]
  );

  // --------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------

  const categories = [
    ["Electronics", "electronics"],
    ["Fashion", "fashion"],
    ["Home", "home"],
    ["Beauty", "beauty"],
    ["Sports", "sports"],
    ["Gadgets", "gadgets"],
  ];

  for (const [name, slug] of categories) {
    await connection.execute(
      `
      INSERT INTO categories
        (name, slug)
      VALUES
        (?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name)
      `,
      [name, slug]
    );
  }

  // --------------------------------------------------
  // GET CATEGORY IDS
  // --------------------------------------------------

  const [categoryRows] = await connection.execute(
    `
    SELECT id, slug
    FROM categories
    `
  );

  const categoryMap = {};

  for (const category of categoryRows) {
    categoryMap[category.slug] = category.id;
  }

  // --------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------

  const products = [
  {
    name: "Aurora Pro Wireless Headphones",
    slug: "aurora-pro-wireless-headphones",
    category: "electronics",
    price: 4999,
    mrp: 6999,
    stock: 50,
    rating: 4.7,
    reviews: 124,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    description:
      "Premium wireless headphones with immersive sound, deep bass and comfortable all-day wear.",
  },

  {
    name: "Nova Smart Watch",
    slug: "nova-smart-watch",
    category: "gadgets",
    price: 3299,
    mrp: 4999,
    stock: 75,
    rating: 4.5,
    reviews: 98,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    description:
      "Modern smartwatch with fitness tracking, notifications and a premium display.",
  },

  {
    name: "Minimal Leather Backpack",
    slug: "minimal-leather-backpack",
    category: "fashion",
    price: 2499,
    mrp: 3999,
    stock: 35,
    rating: 4.6,
    reviews: 67,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    description:
      "Elegant everyday backpack designed for work, travel and modern city life.",
  },

  {
    name: "Luma Ceramic Table Lamp",
    slug: "luma-ceramic-table-lamp",
    category: "home",
    price: 1899,
    mrp: 2799,
    stock: 40,
    rating: 4.4,
    reviews: 43,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    description:
      "A sophisticated ceramic table lamp that adds a warm premium touch to any room.",
  },

  {
    name: "Aero Running Shoes",
    slug: "aero-running-shoes",
    category: "sports",
    price: 2999,
    mrp: 4499,
    stock: 60,
    rating: 4.8,
    reviews: 156,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    description:
      "Lightweight performance running shoes designed for comfort and everyday training.",
  },

  {
    name: "Velvet Skin Care Set",
    slug: "velvet-skin-care-set",
    category: "beauty",
    price: 1599,
    mrp: 2299,
    stock: 80,
    rating: 4.6,
    reviews: 89,
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
    description:
      "A premium skincare collection designed for a simple and elegant daily routine.",
  },
];

  for (const product of products) {
    await connection.execute(
      `
      INSERT INTO products
        (
          category_id,
          name,
          slug,
          description,
          price,
          mrp,
          stock,
          rating,
          review_count,
          image_url
        )
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        category_id = VALUES(category_id),
        name = VALUES(name),
        description = VALUES(description),
        price = VALUES(price),
        mrp = VALUES(mrp),
        stock = VALUES(stock),
        rating = VALUES(rating),
        review_count = VALUES(review_count),
        image_url = VALUES(image_url)
      `,
      [
        categoryMap[product.category],
        product.name,
        product.slug,
        product.description,
        product.price,
        product.mrp,
        product.stock,
        product.rating,
        product.reviews,
        product.image,
      ]
    );
  }

  console.log("");
  console.log("====================================");
  console.log("       AURORA DATABASE SEEDED");
  console.log("====================================");
  console.log("");
  console.log("Admin account:");
  console.log("Email:    admin@aurora.local");
  console.log("Password: Admin@123");
  console.log("");
  console.log("Customer account:");
  console.log("Email:    user@aurora.local");
  console.log("Password: User@123");
  console.log("");
  console.log("Demo categories:", categories.length);
  console.log("Demo products:", products.length);
  console.log("");
  console.log("Seed complete!");
  console.log("");

  await connection.end();
}

main().catch((error) => {
  console.error("");
  console.error("====================================");
  console.error("       DATABASE SEED FAILED");
  console.error("====================================");
  console.error("");
  console.error(error);
  console.error("");

  process.exit(1);
});