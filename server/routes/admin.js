import express from "express";
import conn from "./conn.js"; // Adjust path if needed
import authenticateToken from "../middleware/auth.js"; // Adjust path if needed

const router = express.Router();

// Existing admin routes here (if any)...
// e.g., router.get('/some-admin-route', ...);

// Add the designation creation route
router.post("/create-designation", authenticateToken, (req, res) => {
  const { designation } = req.body;
  const query = "INSERT INTO designations (designation) VALUES (?)";

  if (!designation) {
    res.status(400).json({ error: "Designation is required" });
    return;
  }

  conn.query(query, [designation], (err, result) => {
    if (err) {
      console.error("Error inserting designation:", err);
      res.status(500).json({ error: "Failed to create designation" });
    } else {
      res
        .status(201)
        .json({
          message: "Designation created successfully",
          id: result.insertId,
        });
    }
  });
});

// Export the router
export default router;
