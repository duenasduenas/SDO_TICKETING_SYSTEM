import dotenv from 'dotenv';
import express from 'express';
import conn from './conn.js';

const router = express.Router();
dotenv.config();

router.get("/schools", (req, res) => {
    const district = req.query.district;
    const query = "SELECT schoolCode, school FROM tbl_users WHERE district = ? AND role = 'Staff'";

    conn.query(query, [district], (err, results) => {
        console.log("Query results:", results); // Add this log
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

router.get("/schoolbatches", (req, res) => {
    const query = "SELECT * FROM tbl_batches";
    conn.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching batches:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
    });
  });

  router.get("/deletedevice/:device_name", (req, res) => {
    const deviceName = decodeURIComponent(req.params.device_name);
  
    if (!deviceName) {
      return res.status(400).json({ error: "Device name is required" });
    }
  
    const query = "DELETE FROM tbl_devices WHERE device_name = ?";
    conn.query(query, [deviceName], (err, result) => {
      if (err) {
        console.error("Error deleting device:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: "Device deleted successfully" });
    });
  });
  
  
  
  

router.get("/batches/:schoolCode", (req, res) => {
    const { schoolCode } = req.params;
    console.log("Received schoolCode:", schoolCode); 

    const query = "SELECT * FROM tbl_batches WHERE schoolCode = ? AND status = 'Delivered'";

    conn.query(query, [schoolCode], (err, result) => {
        if (err) {
            console.error("Error fetching batches:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log("Fetched batches from DB:", result); 
        res.json(result);
    });
});


router.get("/receivebatch/:schoolCode", (req, res) => {
    const { schoolCode } = req.params;
    console.log("Received schoolCode:", schoolCode); 

    const query = "SELECT * FROM tbl_batches WHERE schoolCode = ? AND status = 'Pending'";

    conn.query(query, [schoolCode], (err, result) => {
        if (err) {
            console.error("Error fetching batches:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log("Fetched batches from DB:", result); 
        res.json(result);
    });
});

// Get devices for selection
router.get('/devices', (req, res) => {
    const query = 'SELECT device_name FROM tbl_devices';
    conn.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching devices:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(result); // Return the list of device names
    });
});


router.post("/adddevice", (req, res) => {
    const { device_name } = req.body; // Extract device_name from request body

    if (!device_name) {
        return res.status(400).json({ error: "Device name is required" });
    }

    const query = "INSERT INTO tbl_devices (device_name) VALUES (?)";
    conn.query(query, [device_name], (err, result) => {
        if (err) {
            console.error("Error adding device:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log("Added device:", result);
        res.json({ message: "Device added successfully", device_id: result.insertId });
    });
});


// Create a new batch
router.post("/createbatch", (req, res) => {
    const { batchNumber, sendDate, district, schoolCode, schoolName, devices } = req.body;
  
    // Date handling logic remains the same
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const sendDateObj = new Date(sendDate);
    sendDateObj.setHours(0, 0, 0, 0);
    const status = sendDateObj < currentDate ? "Delivered" : "Pending";
    const receivedDate = status === "Delivered" ? sendDate : null;
  
    // Check for duplicate serial numbers first - all at once
    const serialNumbers = devices.map(device => device.serialNumber);
    
    const checkDuplicatesQuery = "SELECT device_number FROM tbl_batch_devices WHERE device_number IN (?)";
    conn.query(checkDuplicatesQuery, [serialNumbers], (err, duplicateResults) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // If we found any duplicates
      if (duplicateResults && duplicateResults.length > 0) {
        const duplicateSerials = duplicateResults.map(row => row.device_number);
        return res.status(400).json({ 
          error: "Duplicate serial numbers found",
          duplicates: duplicateSerials
        });
      }
      
      // Start transaction if no duplicates
      conn.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
  
        // Insert batch
        const batchQuery = "INSERT INTO tbl_batches (batch_number, send_date, schoolCode, school_name, status, received_date) VALUES (?, ?, ?, ?, ?, ?)";
        conn.query(
          batchQuery,
          [batchNumber, sendDate, schoolCode, schoolName, status, receivedDate],
          (err, result) => {
            if (err) {
              return conn.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }
  
            const batchId = result.insertId;
            
            // Prepare all device inserts
            const insertQueries = devices.map(device => {
              return new Promise((resolve, reject) => {
                const insertQuery = "INSERT INTO tbl_batch_devices (batch_id, device_type, device_number) VALUES (?, ?, ?)";
                conn.query(
                  insertQuery,
                  [batchId, device.deviceType, device.serialNumber],
                  (err) => {
                    if (err) {
                      console.error("Error adding device:", err);
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });
  
            // Execute all inserts and commit when done
            Promise.all(insertQueries)
              .then(() => {
                conn.commit(err => {
                  if (err) {
                    return conn.rollback(() => {
                      res.status(500).json({ error: err.message });
                    });
                  }
                  res.status(200).json({ 
                    message: "Batch created successfully!", 
                    batchId, 
                    status 
                  });
                });
              })
              .catch(err => {
                conn.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              });
          }
        );
      });
    });
  });

// Server-side route to get next batch number
router.get("/nextBatchNumber", (req, res) => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, "");
    const query = `
        SELECT batch_number 
        FROM tbl_batches 
        WHERE batch_number LIKE '${today}-%' 
        ORDER BY batch_number DESC 
        LIMIT 1`;

    conn.query(query, (err, results) => {
        if (err) {
            console.error("Error getting next batch number:", err);
            return res.status(500).json({ error: err.message });
        }

        let nextNumber = '0001';
        if (results.length > 0) {
            // Extract the current counter and increment it
            const currentNumber = results[0].batch_number.split('-')[1];
            nextNumber = (parseInt(currentNumber) + 1).toString().padStart(4, '0');
        }

        res.json({ nextBatchNumber: `${today}-${nextNumber}` });
    });
});

// router.get("/getbatches", (req, res) => {
//     const district = req.query.district;
//     const query = "SELECT schoolCode, school FROM tbl_users WHERE district = ? AND role = 'Staff'";

//     conn.query(query, [district], (err, results) => {
//         console.log("Query results:", results); // Add this log
//         if (err) {
//             console.error("Database error:", err);
//             return res.status(500).json({ error: err.message });
//         }
//         res.json(results);
//     });
// });

router.get("/received-batches", (req, res) => {
    const query = `
        SELECT 
            batch_id,
            batch_number,
            school_name,
            received_date
        FROM tbl_batches 
        WHERE status = 'Delivered' 
        AND received_date IS NOT NULL
        ORDER BY received_date DESC
    `;
    
    conn.query(query, (err, result) => {
        if (err) {
            console.error("Error fetching received batches:", err.message);
            return res.status(500).json({ error: "Failed to fetch received batches" });
        }
        res.json(result);
    });
});

router.put("/receivebatch/:batchId", (req, res) => {
    const { batchId } = req.params;
    const query = `
        UPDATE tbl_batches 
        SET status = 'Delivered', 
            received_date = CURRENT_DATE() 
        WHERE batch_id = ?
    `;
    
    conn.query(query, [batchId], (err, result) => {
        if (err) {
            console.error("Error receiving batch:", err.message);
            return res.status(500).json({ error: "Failed to receive batch" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Batch not found" });
        }
        res.json({ message: "Batch received successfully" });
    });
});

router.get("/receivebatch/:schoolCode/pending", (req, res) => {
    const { schoolCode } = req.params;
    const query = `
        SELECT * FROM tbl_batches 
        WHERE schoolCode = ? 
        AND status = 'Pending'
        ORDER BY send_date DESC
    `;
    
    conn.query(query, [schoolCode], (err, result) => {
        if (err) {
            console.error("Error fetching pending batches:", err.message);
            return res.status(500).json({ error: "Failed to fetch pending batches" });
        }
        res.json(result);
    });
});

// Get received batches for a school
router.get("/receivebatch/:schoolCode/received", (req, res) => {
    const { schoolCode } = req.params;
    const query = `
        SELECT * FROM tbl_batches 
        WHERE schoolCode = ? 
        AND status = 'Delivered'
        ORDER BY received_date DESC
    `;
    
    conn.query(query, [schoolCode], (err, result) => {
        if (err) {
            console.error("Error fetching received batches:", err.message);
            return res.status(500).json({ error: "Failed to fetch received batches" });
        }
        res.json(result);
    });
});
router.get("/receivebatch/:schoolCode/:status", (req, res) => {
    const { schoolCode, status } = req.params;
    let orderByColumn;
    
    // Determine sorting based on status
    switch(status.toLowerCase()) {
        case 'received':
        case 'delivered':
            orderByColumn = 'received_date';
            break;
        case 'cancelled':
            orderByColumn = 'cancelled_date';
            break;
        default:
            orderByColumn = 'send_date';
    }
    
    // Safe query that works even if the column doesn't exist
    const query = `
        SELECT * FROM tbl_batches 
        WHERE schoolCode = ? 
        AND status = ?
        ORDER BY send_date DESC
    `;
    
    conn.query(query, [schoolCode, status === 'received' ? 'Delivered' : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()], (err, result) => {
        if (err) {
            console.error(`Error fetching ${status} batches:`, err.message);
            return res.status(500).json({ error: `Failed to fetch ${status} batches` });
        }
        res.json(result || []);
    });
});

router.get("/receivebatch/:schoolCode/cancelled", (req, res) => {
    const { schoolCode } = req.params;
    const query = `
        SELECT * FROM tbl_batches 
        WHERE schoolCode = ? 
        AND status = 'Cancelled'
        ORDER BY send_date DESC  /* Fallback to send_date if cancelled_date doesn't exist */
    `;
    
    conn.query(query, [schoolCode], (err, result) => {
        if (err) {
            console.error("Error fetching cancelled batches:", err.message);
            return res.status(500).json({ error: "Failed to fetch cancelled batches" });
        }
        res.json(result || []);
    });
});

router.put("/cancelbatch/:batchId", (req, res) => {
    const { batchId } = req.params;
    
    // First check if the batch exists and has the correct status
    const checkQuery = "SELECT status FROM tbl_batches WHERE batch_id = ?";
    
    conn.query(checkQuery, [batchId], (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Error checking batch:", checkErr.message);
        return res.status(500).json({ error: "Failed to check batch status" });
      }
      
      if (checkResult.length === 0) {
        return res.status(404).json({ error: "Batch not found" });
      }
      
      if (checkResult[0].status !== "Pending") {
        return res.status(400).json({ 
          error: "Only pending batches can be cancelled" 
        });
      }
      
      // Proceed with the update
      const updateQuery = `
        UPDATE tbl_batches 
        SET status = 'Cancelled', 
            cancelled_date = CURRENT_DATE() 
        WHERE batch_id = ?
      `;
      
      conn.query(updateQuery, [batchId], (err, result) => {
        if (err) {
          console.error("Error cancelling batch:", err.message);
          return res.status(500).json({ error: "Failed to cancel batch" });
        }
        
        res.json({ 
          message: "Batch cancelled successfully",
          batchId
        });
      });
    });
  });


router.get("/getbatch/:batchId/devices", (req, res) => {
    const { batchId } = req.params;
    const query = `
        SELECT device_type, device_number
        FROM tbl_batch_devices
        WHERE batch_id = ?
        ORDER BY device_type
    `;
    
    conn.query(query, [batchId], (err, result) => {
        if (err) {
            console.error("Error fetching batch devices:", err.message);
            return res.status(500).json({ error: "Failed to fetch batch devices" });
        }
        res.json(result);
    });
});

// Update batch (only batch number and send date)
router.put("/updatebatch/:batchId", (req, res) => {
  const batchId = req.params.batchId;
  const { batch_number, send_date } = req.body;

  // Validate required fields
  if (!batch_number || !send_date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query = `
    UPDATE tbl_batches 
    SET 
      batch_number = ?,
      send_date = ?
    WHERE batch_id = ?
  `;

  conn.query(
    query,
    [batch_number, send_date, batchId],
    (err, result) => {
      if (err) {
        console.error("Error updating batch:", err);
        return res.status(500).json({ error: "Failed to update batch" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Batch not found" });
      }

      res.status(200).json({ message: "Batch updated successfully" });
    }
  );
});

// Update devices in a batch
router.put("/updatedevices/:batchId", (req, res) => {
  const batchId = req.params.batchId;
  const { devices } = req.body;

  // Validate input
  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: "No devices provided for update" });
  }

  // Validate each device has required fields
  const invalidDevices = devices.filter(d => !d.batch_devices_id || !d.device_number);
  if (invalidDevices.length > 0) {
    return res.status(400).json({ 
      error: "Some devices are missing required fields",
      details: invalidDevices
    });
  }

  // Start transaction
  conn.beginTransaction(err => {
    if (err) return res.status(500).json({ error: err.message });

    // First verify all devices belong to the batch
    const deviceIds = devices.map(d => d.batch_devices_id);
    
    // Ensure we're not sending empty values
    const validDeviceIds = deviceIds.filter(id => id !== undefined && id !== null);
    
    if (validDeviceIds.length === 0) {
      return conn.rollback(() => {
        res.status(400).json({ error: "No valid device IDs provided" });
      });
    }

    // Query to verify devices
    const checkQuery = `
      SELECT batch_devices_id FROM tbl_batch_devices 
      WHERE batch_devices_id IN (?) AND batch_id = ?
    `;

    conn.query(checkQuery, [validDeviceIds, batchId], (checkErr, checkResults) => {
      if (checkErr) {
        return conn.rollback(() => {
          res.status(500).json({ error: checkErr.message });
        });
      }

      // Verify we found all devices
      if (checkResults.length !== validDeviceIds.length) {
        const foundIds = checkResults.map(r => r.batch_devices_id);
        const missingIds = validDeviceIds.filter(id => !foundIds.includes(id));
        
        return conn.rollback(() => {
          res.status(400).json({ 
            error: "Some devices not found in batch",
            missing: missingIds.length > 0 ? missingIds : ["No valid IDs found"]
          });
        });
      }

      // Process updates
      const updatePromises = devices.map(device => {
        return new Promise((resolve, reject) => {
          const updateQuery = `
            UPDATE tbl_batch_devices 
            SET device_number = ? 
            WHERE batch_devices_id = ? AND batch_id = ?
          `;
          
          conn.query(
            updateQuery,
            [device.device_number, device.batch_devices_id, batchId],
            (updateErr, result) => {
              if (updateErr) {
                reject(updateErr);
              } else if (result.affectedRows === 0) {
                reject(new Error(`No rows updated for device ${device.batch_devices_id}`));
              } else {
                resolve();
              }
            }
          );
        });
      });

      // Execute all updates
      Promise.all(updatePromises)
        .then(() => {
          conn.commit(err => {
            if (err) {
              return conn.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }
            res.status(200).json({ 
              message: "Devices updated successfully",
              count: devices.length
            });
          });
        })
        .catch(err => {
          conn.rollback(() => {
            res.status(500).json({ 
              error: err.message,
              details: "Failed to update one or more devices"
            });
          });
        });
    });
  });
});

// API endpoint to get devices for a specific batch
// API endpoint with explicit field mapping and response debugging
router.get("/getbatch/:batchId/devices", (req, res) => {
  const batchId = req.params.batchId;
  
  // Validate batchId
  if (!batchId || isNaN(parseInt(batchId))) {
    return res.status(400).json({ error: "Invalid batch ID" });
  }
  
  const query = `
    SELECT 
      bd.batch_devices_id,
      bd.batch_id,
      bd.device_type,
      bd.device_number
    FROM tbl_batch_devices bd
    WHERE bd.batch_id = ?
    ORDER BY bd.batch_devices_id
  `;
  
  conn.query(query, [batchId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    
    // Debug - log raw results from database
    console.log("Raw database results:", JSON.stringify(results));
    
    // Explicitly map each field to ensure nothing is lost in translation
    const devices = results.map(row => {
      const device = {
        batch_devices_id: row.batch_devices_id,
        batch_id: row.batch_id,
        device_type: row.device_type,
        device_number: row.device_number
      };
      
      // Debug - log each mapped device
      console.log("Mapped device:", device);
      
      return device;
    });
    
    // Debug - log final response
    console.log("Final API response:", JSON.stringify(devices));
    
    res.json(devices);
  });
});

export default router;
    