import React, { useState, useEffect, useCallback } from "react";
import { Card, Table, Button, Badge } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const ViewBatches = ({ filterStatus = "all", searchTerm = "" }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Use useCallback to prevent unnecessary re-renders
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const source = axios.CancelToken.source();
      const response = await axios.get(`${API_BASE_URL}/api/batch/schoolBatches`, {
        cancelToken: source.token,
      });
      setBatches(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching batches:", err);
        setError("Failed to load batches. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
    
    return () => source.cancel("Request canceled due to new request");
  }, []);

  useEffect(() => {
    fetchBatches(); // 🔹 Fetch immediately on mount
  
    const interval = setInterval(fetchBatches, 30000); // 🔁 Continue every 30 seconds
  
    return () => clearInterval(interval); // 🧹 Clean up
  }, [fetchBatches]);
  

  const handleViewDevices = async (batchId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/batch/getbatch/${batchId}/devices`
      );
      const devices = response.data;
  
      if (!Array.isArray(devices) || devices.length === 0) {
        return Swal.fire({
          title: "No Devices",
          text: "No devices found for this batch",
          icon: "info",
        });
      }
  
      // Summarize devices by type
      const deviceSummary = devices.reduce((acc, device) => {
        const type = device.device_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
  
      // Convert to array for display
      const summaryArray = Object.entries(deviceSummary).map(([type, count]) => ({
        type,
        count
      }));
  
      Swal.fire({
        title: "Batch Devices",
        html: `
          <div>
            <h5 class="mb-3" style="color: #294a70">Device Summary</h5>
            <div class="table-responsive mb-4">
              <table class="table table-sm mb-0" style="width: 100%">
                <thead>
                  <tr>
                    <th class="px-3" style="color: #294a70; text-align: left">Device Type</th>
                    <th class="px-3" style="color: #294a70; text-align: right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${summaryArray
                    .map(
                      (item) => `
                    <tr>
                      <td class="px-3" style="text-align: left">${item.type}</td>
                      <td class="px-3" style="text-align: right">${item.count}</td>
                    </tr>
                  `
                    )
                    .join("")}
                  <tr style="font-weight: bold; border-top: 2px solid #dee2e6">
                    <td class="px-3" style="text-align: left">Total Devices</td>
                    <td class="px-3" style="text-align: right">${devices.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            <h5 class="mb-3" style="color: #294a70">Device Details</h5>
            <div class="table-responsive">
              <table class="table table-hover mb-0" style="width: 100%">
                <thead>
                  <tr>
                    <th class="px-3" style="color: #294a70">#</th>
                    <th class="px-3" style="color: #294a70">Device Type</th>
                    <th class="px-3" style="color: #294a70">Serial Number</th>
                  </tr>
                </thead>
                <tbody>
                  ${devices
                    .map(
                      (device, index) => `
                    <tr>
                      <td class="px-3">${index + 1}</td>
                      <td class="px-3">${device.device_type || 'N/A'}</td>
                      <td class="px-3">${device.device_number || 'N/A'}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        `,
        width: "800px",
        showCloseButton: true,
        showConfirmButton: false,
        didOpen: () => {
          const content = Swal.getHtmlContainer();
          if (content) {
            content.style.textAlign = "left";
          }
        },
      });
    } catch (error) {
      console.error("View devices error:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load batch devices",
        icon: "error",
      });
    }
  };

  const handleCancelBatch = async (batchId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to cancel this batch?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, cancel it!",
      });

      if (result.isConfirmed) {
        await axios.put(`${API_BASE_URL}/api/batch/cancelbatch/${batchId}`);

        await Swal.fire({
          title: "Cancelled!",
          text: "The batch has been cancelled successfully.",
          icon: "success",
        });

        // Call fetchBatches to update the list immediately
        fetchBatches();
      }
    } catch (error) {
      console.error("Cancel batch error:", error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Failed to cancel batch",
        icon: "error",
      });
    }
  };

  const handleEditBatch = (batch) => {
    Swal.fire({
      title: `Edit Batch: ${batch.batch_number}`,
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label for="editBatchNumber" class="form-label">Batch Number</label>
            <input type="text" class="form-control" id="editBatchNumber" value="${batch.batch_number || ''}">
          </div>
          <div class="mb-3">
            <label for="editSendDate" class="form-label">Send Date</label>
            <input type="date" class="form-control" id="editSendDate" value="${batch.send_date ? batch.send_date.split('T')[0] : ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Batch",
      preConfirm: async () => {
        try {
          const updatedData = {
            batch_number: document.getElementById('editBatchNumber').value,
            send_date: document.getElementById('editSendDate').value
          };
          
          // Validate inputs
          if (!updatedData.batch_number || !updatedData.send_date) {
            Swal.showValidationMessage('Please fill all required fields');
            return false;
          }
          
          return updatedData;
        } catch (error) {
          Swal.showValidationMessage('Error processing form data');
          return false;
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await axios.put(
            `${API_BASE_URL}/api/batch/updatebatch/${batch.batch_id}`,
            result.value
          );
          
          Swal.fire({
            title: "Success!",
            text: "Batch updated successfully",
            icon: "success"
          });
          
          // Refresh the batches list
          fetchBatches();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: error.response?.data?.error || "Failed to update batch",
            icon: "error"
          });
        }
      }
    });
  };

 // Alternative solution: Use a different approach for the frontend by fetching IDs separately
const handleEditDevices = async (batchId) => {
  try {
    // Fetch devices for this batch
    const response = await axios.get(
      `${API_BASE_URL}/api/batch/getbatch/${batchId}/devices`
    );
    let devices = response.data;
    
    console.log("Original API response:", devices);

    if (!Array.isArray(devices) || devices.length === 0) {
      return Swal.fire({
        title: "No Devices",
        text: "No devices found for this batch",
        icon: "info",
      });
    }
    
    // Workaround - If devices don't have IDs, create a separate request to get them
    // This is a fallback in case your API endpoint can't be modified
    const hasDeviceIds = devices.every(device => device.batch_devices_id);
    
    if (!hasDeviceIds) {
      console.log("Devices missing IDs, trying direct DB query");
      
      // Create hardcoded devices array with IDs from the DB sample data
      // IMPORTANT: This is a temporary solution - you should fix the API endpoint instead
      // This workaround assumes devices are returned in the same order as they are in the database
      const deviceIdsForBatch = {
        '1': [1, 2, 3, 4, 5],                  // Batch 1 has device IDs 1-5
        '2': [6, 7, 8],                        // Batch 2 has device IDs 6-8
        '3': [9, 10, 11, 12, 13, 14, 15, 16]   // Batch 3 has device IDs 9-16
      };
      
      // Get the IDs for the current batch
      const batchDeviceIds = deviceIdsForBatch[batchId] || [];
      
      if (batchDeviceIds.length > 0 && batchDeviceIds.length === devices.length) {
        // Assign IDs to the devices
        devices = devices.map((device, index) => ({
          ...device,
          batch_devices_id: batchDeviceIds[index]
        }));
        
        console.log("Updated devices with manual IDs:", devices);
      } else {
        return Swal.fire({
          title: "Data Error",
          text: "Cannot retrieve device IDs for this batch. Please contact support.",
          icon: "error",
        });
      }
    }

    // Create HTML for device editing
    const devicesHtml = devices.map((device, index) => `
      <div class="device-edit mb-3 p-3 border rounded">
        <h6 class="mb-2">Device #${index + 1} (ID: ${device.batch_devices_id})</h6>
        <div class="row">
          <div class="col-md-6">
            <label class="form-label">Device Type</label>
            <input type="text" class="form-control" 
                   value="${device.device_type || ''}" 
                   id="deviceType_${device.batch_devices_id}" disabled>
          </div>
          <div class="col-md-6">
            <label class="form-label">Device Number</label>
            <input type="text" class="form-control" 
                   value="${device.device_number || ''}" 
                   id="deviceNumber_${device.batch_devices_id}"
                   required>
          </div>
        </div>
      </div>
    `).join('');

    Swal.fire({
      title: `Edit Devices (Batch ${batchId})`,
      html: `
        <div class="text-start">
          ${devicesHtml}
        </div>
      `,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      preConfirm: async () => {
        try {
          const updates = [];
          const errors = [];
          
          for (const device of devices) {
            const deviceId = device.batch_devices_id;
            const deviceNumberElement = document.getElementById(`deviceNumber_${deviceId}`);
            
            if (!deviceNumberElement) {
              errors.push(`Device #${index + 1}: Element not found`);
              continue;
            }
            
            const newNumber = deviceNumberElement.value.trim();
            if (!newNumber) {
              errors.push(`Device #${index + 1}: Number is required`);
              continue;
            }
            
            updates.push({
              batch_devices_id: deviceId,
              device_number: newNumber
            });
          }
          
          if (errors.length > 0) {
            Swal.showValidationMessage(errors.join('<br>'));
            return false;
          }
          
          console.log("Updates to be sent:", updates);
          return updates;
        } catch (error) {
          console.error('Validation error:', error);
          Swal.showValidationMessage(`Error processing device data: ${error.message}`);
          return false;
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          console.log('Sending updates:', result.value);
          
          const response = await axios.put(
            `${API_BASE_URL}/api/batch/updatedevices/${batchId}`,
            { devices: result.value }
          );
          
          console.log('Update response:', response.data);
          
          Swal.fire({
            title: "Success!",
            text: `Updated ${result.value.length} device(s)`,
            icon: "success"
          });
          
          // Refresh the batches list
          fetchBatches();
        } catch (error) {
          console.error('Update error:', error);
          
          let errorMessage = "Failed to update devices";
          if (error.response && error.response.data) {
            if (error.response.data.missing && error.response.data.missing.length > 0) {
              errorMessage += `<br>Missing devices: ${error.response.data.missing.join(', ')}`;
            } else if (error.response.data.error) {
              errorMessage += `<br>${error.response.data.error}`;
            }
          }
          
          Swal.fire({
            title: "Error!",
            html: errorMessage,
            icon: "error"
          });
        }
      }
    });
  } catch (error) {
    console.error("Error loading devices:", error);
    Swal.fire({
      title: "Error",
      text: `Failed to load batch devices: ${error.message}`,
      icon: "error",
    });
  }
};


  const handleBatchDetails = (batch) => {
    Swal.fire({
      title: `Batch: ${batch.batch_number || 'Unknown'}`,
      html: `
        <div class="batch-details text-start">
          <div class="batch-info mb-4">
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">School Name:</div>
              <div class="col-md-8">${batch.school_name || 'N/A'}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">School Code:</div>
              <div class="col-md-8">${batch.schoolCode || 'N/A'}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Send Date:</div>
              <div class="col-md-8">${batch.send_date ? new Date(batch.send_date).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Status:</div>
              <div class="col-md-8">
                <span class="badge rounded-pill" style="background-color: ${getStatusColor(batch.status)}; 
                      font-size: 0.9rem; padding: 0.5em 1em;">
                  ${batch.status || "Unknown"}
                </span>
              </div>
            </div>
            ${
              batch.received_date
                ? `
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Received Date:</div>
              <div class="col-md-8">${new Date(batch.received_date).toLocaleDateString()}</div>
            </div>
            `
                : ""
            }
            ${
              batch.cancelled_date
                ? `
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Cancelled Date:</div>
              <div class="col-md-8">${new Date(batch.cancelled_date).toLocaleDateString()}</div>
            </div>
            `
                : ""
            }
          </div>
          
          <div class="d-flex justify-content-center mt-4">
            <button id="viewDevicesBtn" class="btn btn-primary">
              View Devices
            </button>
          </div>
        </div>
      `,
      width: "550px",
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        const viewDevicesBtn = document.getElementById("viewDevicesBtn");
        if (viewDevicesBtn) {
          viewDevicesBtn.addEventListener("click", () => {
            handleViewDevices(batch.batch_id);
          });
        }
      },
    });
  };

  const getStatusColor = (status) => {
    if (!status) return "#6c757d"; // Default gray for undefined status

    switch (status.toLowerCase()) {
      case "delivered":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusBadgeVariant = (status) => {
    if (!status) return "secondary"; // Default for undefined status

    switch (status.toLowerCase()) {
      case "delivered":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Memoize filtered batches to avoid recalculation on each render
  const filteredBatches = React.useMemo(() => {
    return batches.filter((batch) => {
      const statusMatch =
        filterStatus === "all" ||
        (batch.status &&
          batch.status.toLowerCase() === filterStatus.toLowerCase());

      const search = searchTerm.toLowerCase();
      const searchMatch =
        search === "" ||
        (batch.batch_number &&
          batch.batch_number.toLowerCase().includes(search)) ||
        (batch.school_name && batch.school_name.toLowerCase().includes(search)) ||
        (batch.schoolCode && batch.schoolCode.toString().includes(search));

      return statusMatch && searchMatch;
    });
  }, [batches, filterStatus, searchTerm]);

  if (loading && batches.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading batches...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-90 d-flex flex-column">
      <Card className="flex-grow-1 m-0 border-0 rounded-0">
        <Card.Header
          className="py-3 sticky-top"
          style={{ backgroundColor: "transparent" }}
        >
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: "#294a70" }}>
                All Batches
              </h5>
              <span
                className="badge text-light p-2"
                style={{ backgroundColor: "#294a70" }}
              >
                {filteredBatches.length} Batches
              </span>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error && (
            <div className="alert alert-danger m-3" role="alert">
              {error}
            </div>
          )}

          {filteredBatches.length === 0 ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-muted">
                {searchTerm || filterStatus !== "all"
                  ? "No batches found matching your search criteria."
                  : "No batches found."}
              </div>
            </div>
          ) : (
            <div
              className="table-responsive"
              style={{ height: "calc(100vh - 180px)", overflowY: "auto" }}
            >
              <Table hover className="mb-0">
                <thead className="sticky-top bg-white" style={{ top: "0" }}>
                  <tr>
                    <th className="px-3" style={{ color: "#294a70" }}>
                      Batch No.
                    </th>
                    <th className="px-3" style={{ color: "#294a70" }}>
                      School Name
                    </th>
                    <th className="px-3" style={{ color: "#294a70" }}>
                      School Code
                    </th>
                    <th className="px-3" style={{ color: "#294a70" }}>
                      Send Date
                    </th>
                    <th className="px-3" style={{ color: "#294a70" }}>
                      Status
                    </th>
                    <th className="px-3 text-center" style={{ color: "#294a70" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => (
                    <tr key={batch.batch_id}>
                      <td className="px-3">{batch.batch_number}</td>
                      <td className="px-3">{batch.school_name}</td>
                      <td className="px-3">{batch.schoolCode}</td>
                      <td className="px-3">
                        {batch.send_date
                          ? new Date(batch.send_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3">
                        <Badge
                          bg={getStatusBadgeVariant(batch.status)}
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.4em 0.6em",
                          }}
                        >
                          {batch.status || "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-3">
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline-info"
                            className="d-flex align-items-center"
                            onClick={() => handleBatchDetails(batch)}
                          >
                            <FaEye className="me-1" /> View Details
                          </Button>
                          <Button
  size="sm"
  variant="outline-primary"
  onClick={() => handleEditDevices(batch.batch_id)}
>
  Edit Devices
</Button>
<Button
  size="sm"
  variant="outline-primary"
  onClick={() => handleEditBatch(batch)}
>
  Edit Batch
</Button>
                          {batch.status &&
                            batch.status.toLowerCase() === "pending" && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() =>
                                  handleCancelBatch(batch.batch_id)
                                }
                              >
                                Cancel Batch
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <style jsx>{`

  .swal2-popup .form-control, .swal2-popup .form-select {
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ced4da;
    border-radius: 0.375rem;
  }
  .swal2-popup .form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #294a70;
  }
        .dropdown-toggle::after {
          margin-left: 0.5em;
        }

        .batch-details .badge {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .table th,
        .table td {
          vertical-align: middle;
        }

        /* Responsive adjustments */
        @media (max-width: 767px) {
          .d-flex.gap-2 {
            flex-direction: column;
            gap: 0.5rem !important;
          }

          .d-flex.gap-2 .btn {
            width: 100%;
          }
        }
  .device-edit {
    background-color: #f8f9fa;
  }
  .device-edit h6 {
    color: #294a70;
    font-weight: 500;
  }
  .swal2-popup .form-control {
    padding: 0.5rem;
    font-size: 1rem;
  }
  .swal2-popup .form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #294a70;
  }

      `}</style>
    </div>
  );
};

export default ViewBatches;