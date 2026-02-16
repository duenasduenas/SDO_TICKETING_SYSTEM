import dotenv from "dotenv";
import express from "express";
import conn from "./conn.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import authenticateToken from "../middleware/auth.js";

dotenv.config();

const router = express.Router();
const secretKey = process.env.SECRET_KEY;

router.get("/idas-reset", async (req, res) => {
    try {
        const query = "SELECT * FROM tbl_idas_reset";
        const [result] = await conn.promise().query(query);

        if (result.length === 0) {
            return res.status(404).json({ message: "No reset requests found." });
        }

        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching reset requests:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.post("/idas-reset", async (req, res) => {
    try {
        const { name, school, schoolId, employeeNumber } = req.body;

        if (!name || !school || !schoolId || !employeeNumber) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const query = "INSERT INTO tbl_idas_reset (name, school, schoolId, employeeNumber) VALUES (?, ?, ?, ?)";
        await conn.promise().query(query, [name, school, schoolId, employeeNumber]);

        res.status(201).json({ message: "Reset request submitted successfully." });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

const generateResetTicketNumber = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetters = Array(3).fill().map(() => letters[Math.floor(Math.random() * letters.length)]).join('');
    const timestampDigits = Date.now().toString().slice(-4);
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    return `RST-${randomLetters}${timestampDigits}${randomNumbers}`;
};



router.post("/change-password", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    if (!userId) {
        return res.status(400).json({ message: "User ID is missing from token." });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New passwords do not match." });
    }

    try {
        const [rows] = await conn.promise().query("SELECT password FROM tbl_users WHERE userId = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await conn.promise().query("UPDATE tbl_users SET password = ? WHERE userId = ?", [hashedPassword, userId]);

        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Update /users/schools route
router.get("/schools", authenticateToken, async (req, res) => {
    try {
        const [rows] = await conn.promise().query(
           "SELECT userId, username, school FROM tbl_users WHERE role = 'Staff' ORDER BY school"
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Update /reset-school-password route
router.post("/reset-school-password", authenticateToken, async (req, res) => {
    try {
        const { school } = req.body; // using `school` instead of `schoolId`
        if (!school) {
            return res.status(400).json({ message: "School name is required." });
        }

        const hashedPassword = await bcrypt.hash("password123", 10);
        await conn.promise().query(
            "UPDATE tbl_users SET password = ? WHERE school = ? AND role = 'Staff'",
            [hashedPassword, school]
        );

        res.status(200).json({ message: "School password reset successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Add this to your backend routes
router.post('/addschools', authenticateToken, async (req, res) => {
  try {
    const { username, password, district, schoolCode, school, address, principal, number, email } = req.body;

    // Check if username already exists
    const [existing] = await conn.promise().query(
      'SELECT userId FROM tbl_users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new school
    const [result] = await conn.promise().query(
      `INSERT INTO tbl_users 
      (username, password, district, schoolCode, school, address, principal, number, email, role) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Staff')`,
      [username, hashedPassword, district, schoolCode, school, address, principal, number, email]
    );

    res.status(201).json({
      message: 'School created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: error });
  }
});

export default router;
