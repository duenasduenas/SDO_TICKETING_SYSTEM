import dotenv from "dotenv";
import express from "express";
import conn from "./conn.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const router = express.Router();
const secretKey = process.env.SECRET_KEY || "default-secret-key"; // Fallback key
const LoginAttempts = {}; // In-memory attempt tracker

// Define allowed origins based on environment
// const allowedOrigins = process.env.NODE_ENV === 'production'
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ["https://ticketing.sdocabuyao.com"]
  : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", 'http://localhost:8080'];

// Debug logging middleware specific to login routes
router.use((req, res, next) => {
  console.log(`[LOGIN] ${req.method} ${req.originalUrl}`);
  next();
});

// IMPORTANT: UPDATED CORS FOR LOGIN ROUTES
router.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if the origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Add healthcheck route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Login service is up' });
});

// Handle root path to avoid 404
router.post("/", (req, res) => {
  res.status(400).json({ 
    message: "Invalid login endpoint. Use /userlogin instead.",
    error: "INVALID_ENDPOINT" 
  });
});

router.post("/userlogin", async (req, res) => {
  console.log("Processing login request");
  
  // Log the origin for debugging
  console.log("Request origin:", req.headers.origin);
  
  // Validate content type
  if (!req.is("application/json")) {
    return res.status(415).json({ message: "Unsupported Media Type" });
  }

  if (!req.body?.username || !req.body?.password) {
    return res.status(400).json({
      message: "Username and password are required",
      error: "MISSING_CREDENTIALS",
    });
  }

  const { username, password } = req.body;
  const currentTime = Date.now();

  // Rate limiting
  const attempt = LoginAttempts[username];
  if (attempt && attempt.count >= 3) {
    const timePassed = (currentTime - attempt.firstAttemptTime) / 1000;
    const retryAfter = Math.max(60 - timePassed, 0);

    if (retryAfter > 0) {
      return res.status(429).json({
        message: "Too many login attempts. Try again later.",
        retryAfter: Math.ceil(retryAfter),
        error: "TOO_MANY_ATTEMPTS",
      });
    }
    delete LoginAttempts[username]; // Reset after cooldown
  }

  try {
    // Database query with promise wrapper
    const results = await new Promise((resolve, reject) => {
      conn.query(
        "SELECT * FROM tbl_users WHERE username = ?",
        [username],
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    if (results.length === 0) {
      return handleLoginFailure(username, currentTime, res);
    }

    let user = results[0];

    // Hash plain-text password if needed
    if (!user.password.startsWith("$2b$")) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update password in DB
      await new Promise((resolve, reject) => {
        conn.query(
          "UPDATE tbl_users SET password = ? WHERE userId = ?",
          [hashedPassword, user.userId],
          (updateErr) => {
            if (updateErr) reject(updateErr);
            else resolve();
          }
        );
      });

      user.password = hashedPassword;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return handleLoginFailure(username, currentTime, res);
    }

    // Create JWT token
    const userData = {
      id: user.userId,
      username: user.username,
      school: user.school,
      schoolCode: user.schoolCode,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
    };

    const token = jwt.sign(userData, secretKey);

    delete LoginAttempts[username];
    
    console.log(`User ${username} logged in successfully`);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
});

function handleLoginFailure(username, currentTime, res) {
  if (!LoginAttempts[username]) {
    LoginAttempts[username] = { count: 1, firstAttemptTime: currentTime };
  } else {
    LoginAttempts[username].count += 1;
  }

  const attempt = LoginAttempts[username];

  if (attempt.count >= 3) {
    return res.status(429).json({
      message: "Too many login attempts. Try again later.",
      retryAfter: 60,
      error: "TOO_MANY_ATTEMPTS",
    });
  }

  return res.status(401).json({
    message: "Invalid username or password",
    remainingAttempts: 3 - attempt.count,
    error: "INVALID_CREDENTIALS",
  });
}

export default router;