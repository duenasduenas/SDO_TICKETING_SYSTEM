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

router.get("/designations", authenticateToken, (req, res) => {
  const query = "SELECT * FROM designations ORDER BY designation ASC";
  conn.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching designations:", err);
      res.status(500).json({ error: "Failed to fetch designations" });
    } else {
      res.status(200).json(results);
    }
  });
});

// Edit designation
router.put("/designation/:id", authenticateToken, (req, res) => {
  const { designation } = req.body;
  const { id } = req.params;
  if (!designation) return res.status(400).json({ error: "Designation is required" });
  conn.query("UPDATE designations SET designation = ? WHERE id = ?", [designation, id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update designation" });
    res.json({ message: "Designation updated successfully" });
  });
});

// Delete designation
router.delete("/designation/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  conn.query("DELETE FROM designations WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete designation" });
    res.json({ message: "Designation deleted successfully" });
  });
});

// Export the router
export default router;
