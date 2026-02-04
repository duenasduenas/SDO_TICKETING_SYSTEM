import React, { useState } from "react";
import { Table, Button, Badge, Modal } from "react-bootstrap";
import { FaEye, FaTrash } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResetAccountRequests = ({
  resetAccountRequests,
  loading,
  filterStatus,
  searchTerm,
  filterMonth,
  filterYear,
  fetchResetAccountRequests,
}) => {
  const [error, setError] = useState("");
  const [showGraph, setShowGraph] = useState(false);

  // Status options and their configurations
  const accountStatusOptions = [
    "Completed",
    "Pending",
    "In Progress",
    "Rejected",
  ];

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "on hold":
        return "#6c757d";
      case "in progress":
        return "#007bff";
      case "rejected":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  // Badge variant mapping
  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "on hold":
        return "secondary";
      case "in progress":
        return "primary";
      case "rejected":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Format values for display
  const formatMiddleName = (middleName) => {
    return middleName && middleName.trim() !== "" ? middleName : "N/A";
  };

  const formatEmail = (email) => {
    return email && email.trim() !== "" ? email : "N/A";
  };
  
  // Get email values
  const getPersonalEmail = (request) => {
    return request.reset_email || request.personalEmail || "N/A";
  };

  const getDepedEmail = (request) => {
    return request.deped_email || "N/A";
  };

  const handleDeleteResetAccountRequest = async (request) => {
    try {
      const result = await Swal.fire({
        title: "Delete Reset Request",
        text: `Are you sure you want to delete reset request ${
          request.resetNumber || request.id
        }? This cannot be undone.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      // Soft-delete: set status to 'Rejected' with a special reason
      await axios.put(
        `${API_BASE_URL}/api/depedacc/deped-account-reset-requests/${request.id}/status`,
        {
          status: "Rejected",
          notes: "Deleted by admin",
        }
      );

      await fetchResetAccountRequests();

      Swal.fire({
        title: "Deleted",
        text: "Reset account request has been deleted.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting reset account request:", err);
      setError("Failed to delete reset account request");
      Swal.fire({
        title: "Error",
        text: "Failed to delete reset account request",
        icon: "error",
      });
    }
  };

  // Handle request status updates
  const handleUpdateResetAccountStatus = async (requestId, newStatus) => {
    try {
      let rejectionReason = '';
      
      if (newStatus.toLowerCase() === 'rejected') {
        const { value: reason, isDismissed } = await Swal.fire({
          title: 'Rejection Reason',
          input: 'textarea',
          inputLabel: 'Please specify the reason for rejection',
          inputPlaceholder: 'Enter rejection reason here...',
          inputAttributes: {
            'aria-label': 'Enter rejection reason here'
          },
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) {
              return 'You need to provide a rejection reason!';
            }
          }
        });
        
        if (isDismissed || !reason) return;
        rejectionReason = reason;
      }

      const result = await Swal.fire({
        title: "Update Status",
        text: `Are you sure you want to mark this request as ${newStatus}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: getStatusColor(newStatus),
        confirmButtonText: `Yes, mark as ${newStatus}`,
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        await axios.put(
          `${API_BASE_URL}/api/depedacc/deped-account-reset-requests/${requestId}/status`,
          {
            status: newStatus,
            notes: rejectionReason
          }
        );
        
        await fetchResetAccountRequests();

        Swal.fire({
          title: "Status Updated",
          text: `Request status has been updated to ${newStatus}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating reset account request status:", error);
      setError("Failed to update request status");

      Swal.fire({
        title: "Error",
        text: "Failed to update request status",
        icon: "error",
      });
    }
  };

  // Show detailed view of a request
  const handleShowRequestDetails = (request) => {
    const statusOptionsHTML = accountStatusOptions
      .filter((status) => status.toLowerCase() !== request.status.toLowerCase())
      .map((status) => {
        return `<option value="${status}" style="color: black;">${status}</option>`;
      })
      .join("");

    const currentStatusBadge = `
      <div class="current-status-badge mb-3">
        <span class="badge rounded-pill" style="background-color: ${getStatusColor(
          request.status
        )}; font-size: 0.9rem; padding: 0.5em 1em;">
          Current Status: ${request.status}
        </span>
      </div>
    `;

    const rejectionReasonSection = request.status.toLowerCase() === 'rejected' && request.notes 
      ? `
        <div class="row mb-2">
          <div class="col-md-4 fw-bold">Rejection Reason:</div>
          <div class="col-md-8 text-danger rejection-reason">${request.notes}</div>
        </div>
        `
      : '';

    Swal.fire({
      title: `Reset Account Request: ${request.id}`,
      html: `
        <div class="request-details text-start">
          <div class="request-info mb-4">
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Account Type:</div>
              <div class="col-md-8">${request.selected_type}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Last Name:</div>
              <div class="col-md-8">${request.surname}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">First Name:</div>
              <div class="col-md-8">${request.first_name}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Middle Name:</div>
              <div class="col-md-8">${formatMiddleName(request.middle_name)}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Personal Email:</div>
              <div class="col-md-8">${formatEmail(getPersonalEmail(request))}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">DepEd Email:</div>
              <div class="col-md-8">${formatEmail(getDepedEmail(request))}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">School:</div>
              <div class="col-md-8">${request.school}</div>
            </div>
            ${rejectionReasonSection}
            ${
              request.school_id
                ? `
                <div class="row mb-2">
                  <div class="col-md-4 fw-bold">School ID:</div>
                  <div class="col-md-8">${request.school_id}</div>
                </div>
                `
                : ""
            }
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Employee Number:</div>
              <div class="col-md-8">${request.employee_number}</div>
            </div>
            <div class="row mb-2">
              <div class="col-md-4 fw-bold">Date Created:</div>
              <div class="col-md-8">${new Date(request.created_at).toLocaleString()}</div>
            </div>
          </div>
          
          <div class="d-flex justify-content-between status-update">
            <div>
              <h5>Status:</h5>
            </div>
            <div class="text-center">
              ${currentStatusBadge}
            </div>
          </div>

          <div class="d-flex justify-content-between mb-4">
            <div>
              <h5>Update Status:</h5>
            </div>
            <div>
              <select id="statusDropdown" class="form-select status-dropdown" style="width: 150px;">
                <option value="" selected disabled>Change Status</option>
                ${statusOptionsHTML}
              </select>
            </div>  
          </div>
          
          <div class="d-flex justify-content-center">
            <button id="updateStatusBtn" class="btn btn-outline-dark update-status-btn">
              Update Status
            </button>
          </div>
        </div>
      `,
      width: "700px",
      customClass: {
        container: "request-swal-container",
        popup: "request-swal-popup",
        content: "request-swal-content",
      },
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        const updateBtn = document.getElementById("updateStatusBtn");
        const statusDropdown = document.getElementById("statusDropdown");

        updateBtn.addEventListener("click", () => {
          const selectedStatus = statusDropdown.value;
          if (selectedStatus) {
            handleUpdateResetAccountStatus(request.id, selectedStatus);
          } else {
            Swal.showValidationMessage("Please select a status");
          }
        });
      },
    });
  };

  // Filter and search logic
  const filteredResetAccountRequests = resetAccountRequests
    .filter((request) => {
      // Hide soft-deleted records (Rejected with special notes)
      if (
        request.status &&
        request.status.toLowerCase() === "rejected" &&
        request.notes === "Deleted by admin"
      ) {
        return false;
      }

      if (filterStatus === "all") return true;
      return request.status.toLowerCase() === filterStatus.toLowerCase();
    })
    .filter((request) => {
      if (!searchTerm || searchTerm === "") return true;

      const searchTermLower = searchTerm.toLowerCase();

      if (request.resetNumber !== undefined) {
        const resetNumberStr = String(request.resetNumber).toLowerCase();
        if (resetNumberStr.includes(searchTermLower)) {
          return true;
        }
      }
      
      if (request.id !== undefined) {
        const idStr = String(request.id).toLowerCase();
        if (idStr.includes(searchTermLower)) {
          return true;
        }
      }

      if (
        request.selected_type &&
        request.selected_type.toLowerCase().includes(searchTermLower)
      ) {
        return true;
      }

      if (
        (request.first_name &&
          request.first_name.toLowerCase().includes(searchTermLower)) ||
        (request.surname &&
          request.surname.toLowerCase().includes(searchTermLower)) ||
        (request.middle_name &&
          request.middle_name.toLowerCase().includes(searchTermLower))
      ) {
        return true;
      }

      if (
        (request.reset_email && request.reset_email.toLowerCase().includes(searchTermLower)) ||
        (request.personalEmail && request.personalEmail.toLowerCase().includes(searchTermLower)) ||
        (request.deped_email && request.deped_email.toLowerCase().includes(searchTermLower))
      ) {
        return true;
      }

      if (
        request.school &&
        request.school.toLowerCase().includes(searchTermLower)
      ) {
        return true;
      }

      return false;
    })
    .filter((request) => {
      // Month filter based on created_at
      if (!filterMonth || filterMonth === "all") return true;
      if (!request.created_at) return false;

      const createdDate = new Date(request.created_at);
      const requestMonth = createdDate.getMonth() + 1; // 1-12
      return requestMonth === Number(filterMonth);
    })
    .filter((request) => {
      // Year filter based on created_at
      if (!filterYear) return true;
      if (!request.created_at) return false;

      const createdDate = new Date(request.created_at);
      const requestYear = createdDate.getFullYear();
      return requestYear === Number(filterYear);
    });

  // Build chart data for status over time (based on filtered reset requests)
  const statusChartConfig = (() => {
    if (!filteredResetAccountRequests || filteredResetAccountRequests.length === 0) {
      return { data: null, options: {} };
    }

    const sorted = [...filteredResetAccountRequests].sort((a, b) => {
      const da = new Date(a.created_at);
      const db = new Date(b.created_at);
      return da - db;
    });

    const dateLabels = [];
    const dateKeyToIndex = new Map();

    sorted.forEach((req) => {
      if (!req.created_at) return;
      const d = new Date(req.created_at);
      const key = d.toISOString().split("T")[0];
      if (!dateKeyToIndex.has(key)) {
        dateKeyToIndex.set(key, dateLabels.length);
        dateLabels.push(d.toLocaleDateString());
      }
    });

    const statuses = ["Completed", "Pending", "In Progress", "Rejected"];
    const statusColors = {
      Completed: "#28a745",
      Pending: "#ffc107",
      "In Progress": "#007bff",
      Rejected: "#dc3545",
    };

    const countsByStatus = {};
    statuses.forEach((status) => {
      countsByStatus[status] = new Array(dateLabels.length).fill(0);
    });

    sorted.forEach((req) => {
      if (!req.created_at || !req.status) return;
      const d = new Date(req.created_at);
      const key = d.toISOString().split("T")[0];
      const idx = dateKeyToIndex.get(key);
      if (idx === undefined) return;

      const normalizedStatus = req.status.toLowerCase();
      const statusKey =
        normalizedStatus === "completed"
          ? "Completed"
          : normalizedStatus === "pending"
          ? "Pending"
          : normalizedStatus === "in progress"
          ? "In Progress"
          : normalizedStatus === "rejected"
          ? "Rejected"
          : null;

      if (statusKey && countsByStatus[statusKey]) {
        countsByStatus[statusKey][idx] += 1;
      }
    });

    const datasets = statuses.map((status) => ({
      label: status,
      data: countsByStatus[status],
      backgroundColor: statusColors[status],
      borderColor: statusColors[status],
      borderWidth: 1,
    }));

    return {
      data: {
        labels: dateLabels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Reset Account Requests by Status",
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Requests",
            },
            ticks: {
              precision: 0,
            },
          },
        },
      },
    };
  })();

  return (
    <>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading requests...</p>
        </div>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0" style={{ color: "#294a70" }}>
              Reset Account Requests
            </h5>
            <div className="d-flex align-items-center" style={{ gap: "10px" }}>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setShowGraph(true)}
              >
                View Graph
              </Button>
              <span
                className="badge text-light p-2"
                style={{ backgroundColor: "#294a70" }}
              >
                {filteredResetAccountRequests.length} Requests
              </span>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError("")}
                aria-label="Close"
              ></button>
            </div>
          )}

          {filteredResetAccountRequests.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="text-center">Request #</th>
                    <th className="text-center">Account Type</th>
                    <th className="text-center">Last Name</th>
                    <th className="text-center">First Name</th>
                    <th className="text-center">Middle Name</th>
                    <th className="text-center">Personal Email</th>
                    <th className="text-center">DepEd Email</th>
                    <th className="text-center">School</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Date</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResetAccountRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="text-center">{request.resetNumber || request.id}</td>
                      <td className="text-center">{request.selected_type}</td>
                      <td className="text-center">{request.surname}</td>
                      <td className="text-center">{request.first_name}</td>
                      <td className="text-center">
                        {formatMiddleName(request.middle_name)}
                      </td>
                      <td className="text-center">
                        {formatEmail(getPersonalEmail(request))}
                      </td>
                      <td className="text-center">
                        {formatEmail(getDepedEmail(request))}
                      </td>
                      <td className="text-center">{request.school}</td>
                      <td className="text-center">
                        <Badge
                          bg={getStatusBadgeVariant(request.status)}
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.4em 0.6em",
                          }}
                        >
                          {request.status}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <div
                          className="d-inline-flex align-items-center"
                          style={{ gap: "6px" }}
                        >
                          <Button
                            size="sm"
                            variant="outline-info"
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            onClick={() => handleShowRequestDetails(request)}
                            title="View details"
                          >
                            <FaEye size={14} />
                          </Button>
                          {/* Delete button removed as per request */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No reset account requests found</h5>
              <p className="text-muted">
                Try adjusting your filters or search term
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status graph modal */}
      <Modal
        show={showGraph}
        onHide={() => setShowGraph(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Status Graph - Reset Account Requests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statusChartConfig.data ? (
            <div style={{ height: "450px" }}>
              <Bar data={statusChartConfig.data} options={statusChartConfig.options} />
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-0">No data available for the selected filters.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .rejection-reason {
          background-color: #fff8f8;
          border-left: 4px solid #dc3545;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border-radius: 4px;
        }
        
        .status-dropdown {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .status-dropdown:focus {
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(0, 123, 255, 0.25);
        }

        .update-status-btn {
          transition: all 0.2s;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .update-status-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .current-status-badge .badge {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
};

export default ResetAccountRequests;