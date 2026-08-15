require("dotenv").config({ path: ".env.local" });

const mysql = require("mysql2/promise");

async function main() {
  console.log("Testing MySQL connection...");
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

  await connection.end();
}

main().catch((error) => {
  console.error("MySQL connection failed:", error.message);
  process.exit(1);
});