import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static file paths
const depedMainPath = path.resolve(__dirname, "..");
const staticFilesPath = path.join(depedMainPath, "client", "dist");
console.log("Static files path:", staticFilesPath);

// Define origins based on environment
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://ticketing.sdocabuyao.com", "http://localhost:5173"]
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "https://ticketing.sdocabuyao.com",
      ];

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cache-Control"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes
app.options("*", cors(corsOptions));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control for API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  }
  next();
});

// Import routes
import loginRoutes from "./routes/login.js";
import ticketRoutes from "./routes/ticket.js";
import batchRoutes from "./routes/batch.js";
import resetRoutes from "./routes/reset.js";
import depedRoutes from "./routes/depedacc.js";
import adminRoutes from "./routes/admin.js";

// Apply routes with proper path prefixes
app.use("/api/login", loginRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/batch", batchRoutes);
app.use("/api/reset", resetRoutes);
app.use("/api/depedacc", depedRoutes);
app.use("/api/admin", adminRoutes);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/deped_uploads",
  express.static(path.join(__dirname, "..", "deped_uploads"))  // Go one level up
);
app.use(express.static(staticFilesPath));
app.use("/assets", express.static(path.join(staticFilesPath, "assets")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Optional: Catch-all for unsupported POST requests (for debugging)
app.post("*", (req, res) => {
  res.status(404).json({ error: "No matching POST route" });
});

// SPA fallback only for GET requests
app.get("*", (req, res) => {
  res.sendFile(path.join(staticFilesPath, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`
  Server started on port ${port}
  Environment: ${process.env.NODE_ENV || "development"}
  Allowed Origins: ${allowedOrigins.join(", ")}
  `);
});
