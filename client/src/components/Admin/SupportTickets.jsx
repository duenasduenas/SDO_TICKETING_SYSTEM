import React, { useState } from "react";
import { Table, Button, Badge, Row, Col } from "react-bootstrap";
import { FaEye, FaPaperclip, FaTrash } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";

const SupportTickets = ({
  tickets,
  loading,
  filterStatus,
  searchTerm,
  filterMonth,
  filterYear,
  fetchTickets,
}) => {
  const [error, setError] = useState("");

  const handleOpenAttachments = (attachments) => {
    try {
      const parsedAttachments = JSON.parse(attachments);

      // Create HTML content for attachments
      const attachmentsHTML = `
                <div class="attachments-container">
                    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        ${parsedAttachments
                          .map((filename) => {
                            const icon = getFileIcon(filename);
                            return `
                                <div class="col">
                                    <div class="card h-100">
                                        <div class="card-body d-flex flex-column">
                                            <div class="text-center mb-3">
                                                <span style="font-size: 2.5rem;">${icon}</span>
                                            </div>
                                            <h5 class="card-title text-truncate mb-3" title="${filename}">
                                                ${filename}
                                            </h5>
                                            <div class="mt-auto">
                                                <button class="btn btn-primary btn-sm w-100 open-file" 
                                                    data-filename="${filename}">
                                                    Open File
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                          })
                          .join("")}
                    </div>
                </div>
            `;

      Swal.fire({
        title: "Attachments",
        html: attachmentsHTML,
        width: "80%",
        customClass: {
          container: "attachments-swal-container",
          popup: "attachments-swal-popup",
          content: "attachments-swal-content",
        },
        didOpen: () => {
          // Add event listeners to the open file buttons
          document.querySelectorAll(".open-file").forEach((button) => {
            button.addEventListener("click", () => {
              const filename = button.getAttribute("data-filename");
              window.open(
                `${API_BASE_URL}/uploads/${filename}`,
                "_blank"
              );
            });
          });
        },
      });
    } catch (error) {
      console.error("Error parsing attachments:", error);
      setError("Failed to load attachments");
      Swal.fire({
        title: "Error",
        text: "Failed to load attachments",
        icon: "error",
      });
    }
  };

  const handleArchiveTicket = async (ticket) => {
    try {
      const result = await Swal.fire({
        title: "Delete Ticket",
        text: `Are you sure you want to delete ticket ${ticket.ticketNumber}? This will archive it.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      await axios.put(`${API_BASE_URL}/api/ticket/tickets/${ticket.ticketId}/archive`);

      await fetchTickets();

      Swal.fire({
        title: "Deleted",
        text: "Ticket has been deleted (archived).",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting ticket:", err);
      setError("Failed to delete ticket");
      Swal.fire({
        title: "Error",
        text: "Failed to delete ticket",
        icon: "error",
      });
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const result = await Swal.fire({
        title: "Update Status",
        text: `Are you sure you want to mark this ticket as ${newStatus}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: getStatusColor(newStatus),
        confirmButtonText: `Yes, mark as ${newStatus}`,
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        await axios.put(`${API_BASE_URL}/api/ticket/tickets/${ticketId}/status`, {
          status: newStatus,
        });
        await fetchTickets();

        Swal.fire({
          title: "Status Updated",
          text: `Ticket status has been updated to ${newStatus}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      setError("Failed to update ticket status");

      Swal.fire({
        title: "Error",
        text: "Failed to update ticket status",
        icon: "error",
      });
    }
  };

  const handleShowTicketDetails = (ticket) => {
    // Create status dropdown options
    const statusOptionsHTML = statusOptions
      .filter((status) => status.toLowerCase() !== ticket.status.toLowerCase()) // Filter out current status
      .map((status) => {
        return `<option value="${status}" style="color: black;">${status}</option>`;
      })
      .join("");

    const currentStatusBadge = `
            <div class="current-status-badge mb-3">
                <span class="badge rounded-pill" style="background-color: ${getStatusColor(
                  ticket.status
                )}; 
                      font-size: 0.9rem; padding: 0.5em 1em;">
                    Current Status: ${ticket.status}
                </span>
            </div>
        `;

    const attachmentsButton =
      ticket.attachments && JSON.parse(ticket.attachments).length > 0
        ? `<button class="btn btn-outline-secondary mt-3 view-attachments">
                 <i class="fas fa-paperclip"></i> View Attachments (${
                   JSON.parse(ticket.attachments).length
                 })
               </button>`
        : "";

    Swal.fire({
      title: `Ticket: ${ticket.ticketNumber}`,
      html: `
                <div class="ticket-details text-start">
                    <div class="ticket-info mb-4">
                        <div class="row mb-2">
                            <div class="col-md-3 fw-bold">Requestor:</div>
                            <div class="col-md-9">${ticket.requestor}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-3 fw-bold">Category:</div>
                            <div class="col-md-9">${ticket.category}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-3 fw-bold">Request:</div>
                            <div class="col-md-9">${ticket.request}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-3 fw-bold">Comments:</div>
                            <div class="col-md-9">${
                              ticket.comments || "No comments"
                            }</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-3 fw-bold">Date:</div>
                            <div class="col-md-9">${new Date(
                              ticket.date
                            ).toLocaleDateString()}</div>
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

                    
                    <div class="text-center mt-4">
                        ${attachmentsButton}
                    </div>
                </div>
            `,
      width: "550px",
      customClass: {
        container: "ticket-swal-container",
        popup: "ticket-swal-popup",
        content: "ticket-swal-content",
      },
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        // Add event listener for update status button
        const updateBtn = document.getElementById("updateStatusBtn");
        const statusDropdown = document.getElementById("statusDropdown");

        updateBtn.addEventListener("click", () => {
          const selectedStatus = statusDropdown.value;
          if (selectedStatus) {
            handleUpdateStatus(ticket.ticketId, selectedStatus);
          } else {
            Swal.showValidationMessage("Please select a status");
          }
        });

        // Add event listener for attachments button if it exists
        const attachmentsBtn = document.querySelector(".view-attachments");
        if (attachmentsBtn) {
          attachmentsBtn.addEventListener("click", () => {
            handleOpenAttachments(ticket.attachments);
          });
        }
      },
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "jpg":
      case "jpeg":
      case "png":
        return "🖼️";
      default:
        return "📎";
    }
  };

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

  const filteredTickets = tickets
    .filter((ticket) => {
      if (filterStatus === "all") return true;
      return ticket.status === filterStatus;
    })
    .filter((ticket) => {
      if (searchTerm === "") return true;

      const term = searchTerm.toLowerCase();
      return (
        (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(term)) ||
        (ticket.requestor && ticket.requestor.toLowerCase().includes(term)) ||
        (ticket.category && ticket.category.toLowerCase().includes(term))
      );
    })
    .filter((ticket) => {
      // Month filter based on ticket.date
      if (!filterMonth || filterMonth === "all") return true;
      if (!ticket.date) return false;

      const createdDate = new Date(ticket.date);
      const ticketMonth = createdDate.getMonth() + 1; // 1-12
      return ticketMonth === Number(filterMonth);
    })
    .filter((ticket) => {
      // Year filter based on ticket.date
      if (!filterYear) return true;
      if (!ticket.date) return false;

      const createdDate = new Date(ticket.date);
      const ticketYear = createdDate.getFullYear();
      return ticketYear === Number(filterYear);
    });

  const statusOptions = [
    "Completed",
    "Pending",
    "On Hold",
    "In Progress",
    "Rejected",
  ];

  return (
<div>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading tickets...</p>
        </div>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0" style={{ color: '#294a70' }}>Tickets</h5>
            <span className="badge text-light p-2" style={{ backgroundColor: '#294a70' }}>
              {filteredTickets.length} Tickets
            </span>
          </div>

          {filteredTickets.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: '10%' }}>Ticket #</th>
                    <th className="text-center" style={{ width: '18%' }}>Requestor</th>
                    <th className="text-center" style={{ width: '10%' }}>Category</th>
                    <th className="text-center" style={{ width: '30%' }}>Request</th>
                    <th className="text-center" style={{ width: '10%' }}>Status</th>
                    <th className="text-center" style={{ width: '10%' }}>Date</th>
                    <th className="text-center" style={{ width: '12%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.ticketNumber}>
                      <td className="text-center">{ticket.ticketNumber}</td>
                      <td className="text-center">{ticket.requestor}</td>
                      <td className="text-center">{ticket.category}</td>
                      <td className="text-center">
                        <div
                          style={{
                            maxWidth: "250px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ticket.request}
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge
                          bg={getStatusBadgeVariant(ticket.status)}
                          style={{ fontSize: "0.85rem", padding: "0.4em 0.6em" }}
                        >
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="text-center">{new Date(ticket.date).toLocaleDateString()}</td>
                      <td className="text-center">
                        <div className="d-inline-flex align-items-center" style={{ gap: "6px" }}>
                          <Button
                            size="sm"
                            variant="outline-info"
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            onClick={() => handleShowTicketDetails(ticket)}
                            title="View details"
                          >
                            <FaEye size={14} />
                          </Button>
                          {ticket.attachments &&
                            JSON.parse(ticket.attachments).length > 0 && (
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", padding: 0 }}
                                onClick={() =>
                                  handleOpenAttachments(ticket.attachments)
                                }
                                title={`View files (${JSON.parse(ticket.attachments).length})`}
                              >
                                <FaPaperclip size={14} />
                              </Button>
                            )}
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
              <h5>No tickets found</h5>
              <p className="text-muted">
                Try adjusting your filters or search term
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add this CSS to your component or in a style tag */}
      <style jsx>{`
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

        .attachments-container .card {
          transition: all 0.2s;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .attachments-container .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );1``
};

export default SupportTickets;
