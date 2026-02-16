import dotenv from "dotenv";
import mysql from "mysql2";

dotenv.config();

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

conn.connect((error) => {
  if (error) throw error;
  console.log("Database Connected");
});

export default conn;
