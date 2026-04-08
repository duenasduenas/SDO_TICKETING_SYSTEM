import React, { useState } from "react";
import { FaEye, FaPaperclip } from "react-icons/fa";
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
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":   return { bg: "#e6f9ed", color: "#1a7c3e", dot: "#28a745" };
      case "pending":     return { bg: "#fff8e6", color: "#8a6000", dot: "#ffc107" };
      case "on hold":     return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
      case "in progress": return { bg: "#e6f0ff", color: "#0056b3", dot: "#007bff" };
      case "rejected":    return { bg: "#fdecea", color: "#b71c1c", dot: "#dc3545" };
      default:            return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":   return "#28a745";
      case "pending":     return "#ffc107";
      case "on hold":     return "#6c757d";
      case "in progress": return "#007bff";
      case "rejected":    return "#dc3545";
      default:            return "#6c757d";
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf":  return "📄";
      case "doc":
      case "docx": return "📝";
      case "xls":
      case "xlsx": return "📊";
      case "jpg":
      case "jpeg":
      case "png":  return "🖼️";
      default:     return "📎";
    }
  };

  const handleOpenAttachments = (attachments) => {
    try {
      const parsed = JSON.parse(attachments);
      const html = parsed.map((filename) => `
        <div class="col-sm-6 col-md-4 mb-3">
          <div style="border:1px solid #e4ecf4;border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:2rem;margin-bottom:6px;">${getFileIcon(filename)}</div>
            <div style="font-size:0.78rem;color:#3d5166;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px;" title="${filename}">${filename}</div>
            <button class="btn btn-sm open-file" data-filename="${filename}"
              style="background:#e6f0ff;color:#0056b3;border:none;border-radius:5px;font-size:0.78rem;font-weight:600;">
              Open File
            </button>
          </div>
        </div>`).join("");

      Swal.fire({
        title: "Attachments",
        html: `<div class="container-fluid"><div class="row">${html}</div></div>`,
        width: "700px",
        showCloseButton: true,
        showConfirmButton: false,
        didOpen: () => {
          document.querySelectorAll(".open-file").forEach((btn) => {
            btn.addEventListener("click", () => {
              window.open(`${API_BASE_URL}/uploads/${btn.getAttribute("data-filename")}`, "_blank");
            });
          });
        },
      });
    } catch (err) {
      setError("Failed to load attachments");
      Swal.fire({ title: "Error", text: "Failed to load attachments", icon: "error" });
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
        await axios.put(`${API_BASE_URL}/api/ticket/tickets/${ticketId}/status`, { status: newStatus });
        await fetchTickets();
        Swal.fire({ title: "Status Updated", text: `Ticket status updated to ${newStatus}`, icon: "success", timer: 2000, showConfirmButton: false });
      }
    } catch {
      setError("Failed to update ticket status");
      Swal.fire({ title: "Error", text: "Failed to update ticket status", icon: "error" });
    }
  };

  const handleShowTicketDetails = (ticket) => {
    const statusOptionsHTML = statusOptions
      .filter((s) => s.toLowerCase() !== ticket.status.toLowerCase())
      .map((s) => `<option value="${s}" style="color:black;">${s}</option>`)
      .join("");

    const st = getStatusStyle(ticket.status);
    const currentStatusBadge = `
      <div class="current-status-badge mb-3">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;
          background:${st.bg};color:${st.color};font-size:0.82rem;font-weight:600;">
          <span style="width:7px;height:7px;border-radius:50%;background:${st.dot};display:inline-block;"></span>
          ${ticket.status}
        </span>
      </div>`;

    const attachmentsButton =
      ticket.attachments && JSON.parse(ticket.attachments).length > 0
        ? `<button class="btn btn-sm view-attachments" style="background:#f0f4f9;color:#3d5166;border:1.5px solid #d0dbe8;border-radius:6px;font-size:0.8rem;font-weight:500;padding:5px 14px;">
             <i class="fas fa-paperclip" style="margin-right:5px;"></i>View Attachments (${JSON.parse(ticket.attachments).length})
           </button>`
        : "";

    Swal.fire({
      title: `<span style="font-size:1rem;font-weight:700;color:#1a2e4a;">Ticket: <span style="font-family:'Courier New',monospace;">${ticket.ticketNumber}</span></span>`,
      html: `
        <div style="font-size:0.88rem;text-align:left;">
          <div style="background:#f5f8fc;border-radius:8px;padding:14px;margin-bottom:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
              <div>
                <div style="color:#7a8fa6;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;">Requestor</div>
                <div style="font-weight:600;color:#1a2e4a;">${ticket.requestor}</div>
              </div>
              <div>
                <div style="color:#7a8fa6;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;">Category</div>
                <div style="display:inline-block;padding:2px 9px;border-radius:4px;font-size:0.75rem;font-weight:600;background:#e8f4fd;color:#1a6fa8;">${ticket.category}</div>
              </div>
            </div>
            <div style="margin-bottom:10px;">
              <div style="color:#7a8fa6;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Request</div>
              <div style="color:#2c3e50;line-height:1.5;">${ticket.request}</div>
            </div>
            <div style="margin-bottom:10px;">
              <div style="color:#7a8fa6;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Comments</div>
              <div style="color:#2c3e50;line-height:1.5;">${ticket.comments || "No comments"}</div>
            </div>
            <div>
              <div style="color:#7a8fa6;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;">Date</div>
              <div style="color:#5a7a99;">${new Date(ticket.date).toLocaleDateString()}</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-weight:600;color:#1a2e4a;font-size:0.88rem;">Current Status</span>
            ${currentStatusBadge}
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <span style="font-weight:600;color:#1a2e4a;font-size:0.88rem;">Update Status</span>
            <select id="statusDropdown" class="form-select" style="width:150px;font-size:0.82rem;border:1.5px solid #d0dbe8;border-radius:6px;padding:5px 8px;">
              <option value="" selected disabled>Change Status</option>
              ${statusOptionsHTML}
            </select>
          </div>

          <div style="display:flex;justify-content:center;margin-bottom:14px;">
            <button id="updateStatusBtn" style="background:#1a2e4a;color:#fff;border:none;border-radius:6px;padding:7px 24px;font-size:0.82rem;font-weight:600;cursor:pointer;transition:background .15s;">
              Update Status
            </button>
          </div>

          <div style="text-align:center;">${attachmentsButton}</div>
        </div>`,
      width: "560px",
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        document.getElementById("updateStatusBtn").addEventListener("click", () => {
          const sel = document.getElementById("statusDropdown").value;
          if (sel) handleUpdateStatus(ticket.ticketId, sel);
          else Swal.showValidationMessage("Please select a status");
        });
        const attachBtn = document.querySelector(".view-attachments");
        if (attachBtn) attachBtn.addEventListener("click", () => handleOpenAttachments(ticket.attachments));
      },
    });
  };

  const statusOptions = ["Completed", "Pending", "On Hold", "In Progress", "Rejected"];

  const filteredTickets = tickets
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .filter((t) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.ticketNumber?.toLowerCase().includes(term) ||
        t.requestor?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term)
      );
    })
    .filter((t) => {
      if (!filterMonth || filterMonth === "all") return true;
      return t.date && new Date(t.date).getMonth() + 1 === Number(filterMonth);
    })
    .filter((t) => {
      if (!filterYear) return true;
      return t.date && new Date(t.date).getFullYear() === Number(filterYear);
    })
    // ── NEW: filter by clicked status pill ──
    .filter((t) => {
      if (activeStatusFilter === "all") return true;
      return t.status?.toLowerCase() === activeStatusFilter.toLowerCase();
    });

  // Status summary counts (based on tickets BEFORE pill filter so counts stay accurate)
  const baseTickets = tickets
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .filter((t) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.ticketNumber?.toLowerCase().includes(term) ||
        t.requestor?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term)
      );
    })
    .filter((t) => {
      if (!filterMonth || filterMonth === "all") return true;
      return t.date && new Date(t.date).getMonth() + 1 === Number(filterMonth);
    })
    .filter((t) => {
      if (!filterYear) return true;
      return t.date && new Date(t.date).getFullYear() === Number(filterYear);
    });

  const statusCounts = statusOptions.reduce((acc, s) => {
    acc[s] = baseTickets.filter((t) => t.status?.toLowerCase() === s.toLowerCase()).length;
    return acc;
  }, {});

  const pillStyles = {
    Completed:    { bg: "#e6f9ed", color: "#1a7c3e", border: "#b7eacc" },
    Pending:      { bg: "#fff8e6", color: "#8a6000", border: "#ffe8a3" },
    "On Hold":    { bg: "#f0f0f0", color: "#555",    border: "#d0d0d0" },
    "In Progress":{ bg: "#e6f0ff", color: "#0056b3", border: "#b3d0ff" },
    Rejected:     { bg: "#fdecea", color: "#b71c1c", border: "#f5c6c3" },
  };

  return (
    <>
      <style>{`
        .st-wrapper { font-family: 'Segoe UI', system-ui, sans-serif; }
        .st-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
        .st-title { font-size:1.2rem; font-weight:700; color:#1a2e4a; margin:0; }
        .st-result-count { font-size:0.82rem; color:#7a8fa6; margin-bottom:12px; }
        .st-status-pills { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
        .st-pill {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 14px; border-radius:20px;
          font-size:0.82rem; font-weight:600;
          border:1.5px solid transparent;
          cursor:pointer;
          transition: opacity .15s, box-shadow .15s, transform .1s;
          user-select:none;
        }
        .st-pill:hover { opacity: 0.85; transform: translateY(-1px); }
        .st-pill.st-pill-active {
          box-shadow: 0 0 0 2.5px currentColor;
        }
        .st-pill-all {
          background:#f0f4f9; color:#3d5166;
          border-color:#d0dbe8;
        }
        .st-pill-all.st-pill-active {
          box-shadow: 0 0 0 2.5px #3d5166;
        }
        .st-pill-count { font-size:1rem; font-weight:700; margin-right:2px; }
        .st-table-wrap { border-radius:8px; overflow:hidden; border:1px solid #e4ecf4; }
        .st-table { width:100%; border-collapse:collapse; font-size:0.82rem; background:#fff; }
        .st-table thead tr { background:#f5f8fc; border-bottom:1.5px solid #e4ecf4; }
        .st-table thead th {
          padding:10px 12px; text-align:left; font-weight:600;
          color:#7a8fa6; text-transform:uppercase;
          font-size:0.72rem; letter-spacing:0.04em; white-space:nowrap;
        }
        .st-table tbody tr { border-bottom:1px solid #f0f4f9; transition:background .12s; }
        .st-table tbody tr:last-child { border-bottom:none; }
        .st-table tbody tr:hover { background:#f8fbff; }
        .st-table td { padding:9px 12px; color:#2c3e50; vertical-align:middle; }
        .st-ticket-num { font-family:'Courier New',monospace; font-size:0.75rem; color:#5a7a99; font-weight:600; }
        .st-category-badge { display:inline-block; padding:2px 9px; border-radius:4px; font-size:0.75rem; font-weight:600; background:#e8f4fd; color:#1a6fa8; }
        .st-requestor { font-weight:600; color:#1a2e4a; font-size:0.82rem; }
        .st-request-text { max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; color:#3d5166; }
        .st-status-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; white-space:nowrap; }
        .st-status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
        .st-date-text { white-space:nowrap; color:#5a7a99; font-size:0.78rem; }
        .st-action-group { display:inline-flex; gap:4px; align-items:center; }
        .st-icon-btn { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; border:1.5px solid; background:transparent; cursor:pointer; transition:background .15s, transform .1s; font-size:12px; }
        .st-icon-btn:hover { transform:translateY(-1px); }
        .st-icon-btn-view  { border-color:#a8d8f0; color:#1a7ab8; }
        .st-icon-btn-view:hover  { background:#e6f4fb; }
        .st-icon-btn-file  { border-color:#c8c8c8; color:#5a6a7a; }
        .st-icon-btn-file:hover  { background:#f0f0f0; }
        .st-empty { text-align:center; padding:48px 0; color:#7a8fa6; }
        .st-empty-icon { font-size:2.2rem; margin-bottom:10px; opacity:0.4; }
      `}</style>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#294a70" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2" style={{ color: "#7a8fa6", fontSize: "0.9rem" }}>Loading tickets...</p>
        </div>
      ) : (
        <div className="st-wrapper">
          {/* Header */}
          <div className="st-header-row">
            <h5 className="st-title">Tickets</h5>
          </div>
          <div className="st-result-count">
            {filteredTickets.length} result{filteredTickets.length !== 1 ? "s" : ""} found
          </div>

          {/* Status Summary Pills — now clickable */}
          <div className="st-status-pills">
            {/* "All" pill */}
            <span
              className={`st-pill st-pill-all${activeStatusFilter === "all" ? " st-pill-active" : ""}`}
              onClick={() => setActiveStatusFilter("all")}
              title="Show all tickets"
            >
              <span className="st-pill-count">{baseTickets.length}</span>
              All
            </span>

            {statusOptions.map((s) => {
              const p = pillStyles[s] || { bg: "#f0f0f0", color: "#555", border: "#ddd" };
              const isActive = activeStatusFilter.toLowerCase() === s.toLowerCase();
              return (
                <span
                  key={s}
                  className={`st-pill${isActive ? " st-pill-active" : ""}`}
                  style={{ background: p.bg, color: p.color, borderColor: p.border }}
                  onClick={() =>
                    setActiveStatusFilter(isActive ? "all" : s)
                  }
                  title={`Filter by ${s}`}
                >
                  <span className="st-pill-count">{statusCounts[s] ?? 0}</span>
                  {s}
                </span>
              );
            })}
          </div>

          {/* Table */}
          {filteredTickets.length > 0 ? (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Requestor</th>
                    <th>Category</th>
                    <th>Request</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const st = getStatusStyle(ticket.status);
                    const hasAttachments = ticket.attachments && JSON.parse(ticket.attachments).length > 0;

                    return (
                      <tr key={ticket.ticketNumber}>
                        <td><span className="st-ticket-num">{ticket.ticketNumber}</span></td>
                        <td><span className="st-requestor">{ticket.requestor}</span></td>
                        <td><span className="st-category-badge">{ticket.category}</span></td>
                        <td>
                          <div className="st-request-text" title={ticket.request}>
                            {ticket.request}
                          </div>
                        </td>
                        <td>
                          <span className="st-status-badge" style={{ background: st.bg, color: st.color }}>
                            <span className="st-status-dot" style={{ background: st.dot }} />
                            {ticket.status}
                          </span>
                        </td>
                        <td><span className="st-date-text">{new Date(ticket.date).toLocaleDateString()}</span></td>
                        <td>
                          <div className="st-action-group">
                            <button
                              className="st-icon-btn st-icon-btn-view"
                              onClick={() => handleShowTicketDetails(ticket)}
                              title="View details"
                            >
                              <FaEye size={12} />
                            </button>
                            {hasAttachments && (
                              <button
                                className="st-icon-btn st-icon-btn-file"
                                onClick={() => handleOpenAttachments(ticket.attachments)}
                                title={`View attachments (${JSON.parse(ticket.attachments).length})`}
                              >
                                <FaPaperclip size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="st-empty">
              <div className="st-empty-icon">🔍</div>
              <h6 style={{ color: "#3d5166", fontWeight: 600 }}>No tickets found</h6>
              <p style={{ fontSize: "0.83rem" }}>Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SupportTickets;