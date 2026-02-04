import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import conn from "./conn.js";

const router = express.Router();

// Workaround for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// CORS Headers
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname,'..', "deped_uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, DOCS and PDF allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "proofOfIdentity", maxCount: 1 },
  { name: "prcID", maxCount: 1 },
  { name: "endorsementLetter", maxCount: 1 },
]);

router.use(express.json());
console.log("depedacc loaded")

// === Account Request ===
router.post("/request-deped-account", async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError || err) {
      console.error("Upload error:", err);
      return res.status(400).json({ error: err.message });
    }

    const {
      selectedType, surname, firstName, middleName,
      designation, school, schoolID, personalGmail,
    } = req.body;

    if (!selectedType || !surname || !firstName || !designation || !school || !schoolID || !personalGmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const fullName = `${surname}, ${firstName} ${middleName || ""}`.trim();
    const proofOfIdentity = req.files?.proofOfIdentity?.[0]?.filename;
    const prcID = req.files?.prcID?.[0]?.filename;
    const endorsementLetter = req.files?.endorsementLetter?.[0]?.filename;

    if (!proofOfIdentity || !prcID || !endorsementLetter) {
      return res.status(400).json({ error: "All files are required" });
    }

    try {
      // 🔥 Generate proper REQ ticket (REQ-YYYY-MM-DD-0001)
      const requestNumber = await generateTicket("REQ");

      const query = `
        INSERT INTO deped_account_requests
        (requestNumber, selected_type, name, surname, first_name, middle_name, designation, school, school_id, personal_gmail,
         proof_of_identity, prc_id, endorsement_letter)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      conn.query(query, [
        requestNumber, selectedType, fullName, surname, firstName, middleName || "",
        designation, school, schoolID, personalGmail,
        proofOfIdentity, prcID, endorsementLetter
      ], (insertErr, result) => {
        if (insertErr) {
          console.error("Insert error:", insertErr);
          return res.status(500).json({ error: "Failed to submit request" });
        }

        res.json({
          message: "Request submitted successfully",
          requestId: result.insertId,
          requestNumber
        });
      });

    } catch (err) {
      console.error("Ticket generation failed:", err);
      res.status(500).json({ error: "Failed to generate request number" });
    }
  });
});


// === Reset Request ===
router.post("/reset-deped-account", async (req, res) => {
  const resetNumber = await generateResetTicketNumber();
  const { 
    selectedType, 
    surname, 
    firstName, 
    middleName, 
    school, 
    schoolID, 
    employeeNumber,
    personalEmail,
    deped_email // Add this new required field
  } = req.body;

  // Add deped_email to required fields check
  if (!selectedType || !surname || !firstName || !school || !schoolID || !employeeNumber || !personalEmail || !deped_email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate DepEd email format
  if (!deped_email.endsWith('@deped.gov.ph')) {
    return res.status(400).json({ error: "DepEd email must end with @deped.gov.ph" });
  }

  const fullName = `${surname}, ${firstName} ${middleName || ""}`.trim();

  // Update the query to include deped_email
  const query = `
    INSERT INTO deped_account_reset_requests
    (resetNumber, selected_type, name, surname, first_name, middle_name, school, school_id, employee_number, reset_email, deped_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  conn.query(query, [
    resetNumber, 
    selectedType, 
    fullName, 
    surname, 
    firstName, 
    middleName || "", 
    school, 
    schoolID, 
    employeeNumber,
    personalEmail,
    deped_email
  ], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to submit reset request", dbError: err.message });
    }
    res.json({ 
      message: "Reset request submitted successfully", 
      requestId: result.insertId, 
      resetNumber,
      depedEmail: deped_email // Optionally return the deped email in response
    });
  });
});

// === Get Schools ===
router.get("/schoolList", (req, res) => {
  const query = "SELECT schoolCode, school FROM tbl_users GROUP BY schoolCode, school";
  conn.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get all designations
router.get("/designations", (req, res) => {
  const query = "SELECT id, designation FROM designations ORDER BY designation ASC";
  conn.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// === View Requests ===
// Add explicit array check and empty array fallback
router.get("/deped-account-requests", (req, res) => {
  conn.query("SELECT * FROM deped_account_requests ORDER BY created_at ASC", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch account requests" });
    }
    console.log('Returning requests:', results);
    res.json(Array.isArray(results) ? results : []);
  });
});

// Same for reset requests
router.get("/deped-account-reset-requests", (req, res) => {
  conn.query("SELECT * FROM deped_account_reset_requests ORDER BY created_at ASC", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch reset requests" });
    }
    res.json(Array.isArray(results) ? results : []);
  });
});

// === Update Status ===
router.put("/deped-account-requests/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, email_reject_reason } = req.body;
  
  let query = "UPDATE deped_account_requests SET status = ?";
  let params = [status];
  
  if (status === 'Rejected' && email_reject_reason) {
    query += ", email_reject_reason = ?";
    params.push(email_reject_reason);
  }
  
  query += " WHERE id = ?";
  params.push(id);
  
  conn.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: "Failed to update status" });
    res.json({ message: "Status updated" });
  });
});

router.put("/deped-account-reset-requests/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const query = `
    UPDATE deped_account_reset_requests
    SET status = ?, notes = ?, completed_at = ${status === "completed" ? "CURRENT_TIMESTAMP" : "NULL"}
    WHERE id = ?
  `;

  conn.query(query, [status, notes, id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update status" });
    res.json({ message: "Status updated" });
  });
});

// === Delete Requests ===
router.delete("/deped-account-requests/:id", (req, res) => {
  const { id } = req.params;

  conn.query(
    "DELETE FROM deped_account_requests WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Failed to delete account request:", err);
        return res
          .status(500)
          .json({ error: "Failed to delete account request" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json({ message: "Account request deleted" });
    }
  );
});

router.delete("/deped-account-reset-requests/:id", (req, res) => {
  const { id } = req.params;

  conn.query(
    "DELETE FROM deped_account_reset_requests WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Failed to delete reset request:", err);
        return res
          .status(500)
          .json({ error: "Failed to delete reset request" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json({ message: "Reset request deleted" });
    }
  );
});

// === Check Transaction ===
router.get("/check-transaction", (req, res) => {
  const { number } = req.query;
  if (!number) return res.status(400).json({ error: "Transaction number is required" });

  const isLegacyRequest = number.startsWith("REQ-");
  const isReset = number.startsWith("RST-");

  // New request format: YYYYMMDD-XX (e.g., 20250116-01)
  const isNewRequestFormat = /^\d{8}-\d{2}$/.test(number);

  const isRequest = isLegacyRequest || isNewRequestFormat;

  if (!isRequest && !isReset) {
    return res.status(400).json({ error: "Invalid transaction number" });
  }

  const query = isRequest
    ? "SELECT requestNumber AS number, name, school, status, email_reject_reason AS notes FROM deped_account_requests WHERE requestNumber = ?"
    : "SELECT resetNumber AS number, name, school, status, notes FROM deped_account_reset_requests WHERE resetNumber = ?";

  conn.query(query, [number], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to check transaction" });
    if (results.length === 0) return res.status(404).json({ error: "Transaction not found" });
    res.json(results);
  });
});

// === Ticket Generators ===
// New format: YYYYMMDD-XX  (e.g., 20250529-01)
// The last two digits are a random number from 01-99 so IDs
// stay short but unlikely to collide within the same day.

async function generateResetTicketNumber() {
  // Example using a table `deped_ticket_counters`
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // "2026-02-04"
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT last_seq FROM deped_ticket_counters 
      WHERE date = ? AND type = 'RST'
    `;
    conn.query(query, [dateStr], (err, results) => {
      if (err) return reject(err);

      let seq = 1;
      if (results.length) seq = results[0].last_seq + 1;

      const resetNumber = `RST-${dateStr}-${String(seq).padStart(4, "0")}`;

      // Update or insert the counter
      const upsertQuery = `
        INSERT INTO deped_ticket_counters (date, type, last_seq) 
        VALUES (?, 'RST', ?) 
        ON DUPLICATE KEY UPDATE last_seq = ?
      `;
      conn.query(upsertQuery, [dateStr, seq, seq], (upsertErr) => {
        if (upsertErr) return reject(upsertErr);
        resolve(resetNumber);
      });
    });
  });
}

async function generateTicket(type = "REQ") {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // "2026-02-04"

  return new Promise((resolve, reject) => {
    const query = `
      SELECT last_seq FROM deped_ticket_counters 
      WHERE date = ? AND type = ?
    `;
    conn.query(query, [dateStr, type], (err, results) => {
      if (err) return reject(err);

      let seq = 1;
      if (results.length) seq = results[0].last_seq + 1;

      const requestNumber = `${type}-${dateStr}-${String(seq).padStart(4, "0")}`;

      const upsertQuery = `
        INSERT INTO deped_ticket_counters (date, type, last_seq) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE last_seq = ?
      `;
      conn.query(upsertQuery, [dateStr, type, seq, seq], (upsertErr) => {
        if (upsertErr) return reject(upsertErr);
        resolve(requestNumber);
      });
    });
  });
}


export default router;
