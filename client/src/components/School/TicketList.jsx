import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Swal from "sweetalert2";
import { FaSearch, FaEye, FaTrash, FaPaperclip, FaTimes } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const TicketList = ({ status }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const NON_ARCHIVABLE_STATUSES = ["In Progress", "On Hold"];

  const getStatusStyle = (s) => {
    switch ((s || "").toLowerCase()) {
      case "completed":    return { bg: "#e6f9ed", color: "#1a7c3e", dot: "#28a745" };
      case "pending":      return { bg: "#fff8e6", color: "#8a6000", dot: "#ffc107" };
      case "on hold":      return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
      case "in progress":  return { bg: "#e6f0ff", color: "#0056b3", dot: "#007bff" };
      case "rejected":     return { bg: "#fdecea", color: "#b71c1c", dot: "#dc3545" };
      default:             return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
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

  const handleViewTicket = (ticket) => {
    Swal.fire({
      title: "Ticket Details",
      html: `
        <div style="font-size:0.88rem;text-align:left;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div>
              <div style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Ticket Number</div>
              <div style="font-weight:600;color:#1a2e4a;font-family:'Courier New',monospace;">${ticket.ticketNumber}</div>
            </div>
            <div>
              <div style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Category</div>
              <div style="font-weight:600;color:#1a2e4a;">${ticket.category}</div>
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Request</div>
            <div style="background:#f5f8fc;border-radius:6px;padding:10px;color:#2c3e50;line-height:1.5;">${ticket.request}</div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Comments</div>
            <div style="background:#f5f8fc;border-radius:6px;padding:10px;color:#2c3e50;line-height:1.5;">${ticket.comments || "—"}</div>
          </div>
          <div>
            <div style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Date</div>
            <div style="color:#5a7a99;">${new Date(ticket.date).toLocaleString()}</div>
          </div>
        </div>`,
      width: "700px",
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  const handleOpenAttachments = (attachments) => {
    try {
      const parsed = JSON.parse(attachments);
      const html = parsed.map((filename) => `
        <div class="col-sm-6 col-md-4 mb-3">
          <div style="border:1px solid #e4ecf4;border-radius:8px;padding:14px;text-align:center;transition:box-shadow .15s;">
            <div style="font-size:2rem;margin-bottom:6px;">${getFileIcon(filename)}</div>
            <div style="font-size:0.78rem;color:#3d5166;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px;" title="${filename}">${filename}</div>
            <button class="btn btn-sm" style="background:#e6f0ff;color:#0056b3;border:none;border-radius:5px;font-size:0.78rem;font-weight:600;"
              onclick="window.open('${API_BASE_URL}/uploads/${filename}','_blank')">Open File</button>
          </div>
        </div>`).join("");

      Swal.fire({
        title: "Attachments",
        html: `<div class="container-fluid"><div class="row">${html}</div></div>`,
        width: "700px",
        showCloseButton: true,
        showConfirmButton: false,
      });
    } catch {
      setError("Failed to load attachments");
    }
  };

  const handleArchiveTicket = async (ticketId) => {
    try {
      const result = await Swal.fire({
        title: "Delete Ticket",
        text: "Are you sure you want to delete this ticket? This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        await axios.put(`${API_BASE_URL}/api/ticket/tickets/${ticketId}/archive`);
        setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
        Swal.fire({ title: "Deleted", text: "Ticket has been deleted.", icon: "success", timer: 2000, showConfirmButton: false });
      }
    } catch {
      setError("Failed to delete ticket");
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token");
        const decoded = jwtDecode(token);
        const response = await axios.get(
          `${API_BASE_URL}/api/ticket/tickets/${decoded.username}/${status}`
        );
        setTickets(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [status]);

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.request.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusStyle = getStatusStyle(status);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <div className="spinner-border" style={{ color: "#294a70" }} role="status">
        <span className="visually-hidden">Loading tickets...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <div style={{ color: "#dc3545", fontSize: "0.9rem" }}>{error}</div>
    </div>
  );

  return (
    <>
      <style>{`
        .tl-wrapper {
          font-family: 'Segoe UI', system-ui, sans-serif;
          margin-top: 60px;
          padding: 0 4px;
        }

        .tl-header {
          padding: 18px 0 12px;
          position: sticky;
          top: 56px;
          background: #f7f9fc;
          z-index: 10;
        }

        .tl-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .tl-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1a2e4a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tl-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .tl-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }

        .tl-count-badge {
          font-size: 0.78rem;
          font-weight: 600;
          background: #294a70;
          color: #fff;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .tl-search-wrap {
          display: flex;
          align-items: center;
          gap: 0;
          max-width: 360px;
          border: 1.5px solid #d0dbe8;
          border-radius: 7px;
          overflow: hidden;
          background: #fff;
          margin-top: 10px;
        }

        .tl-search-icon {
          padding: 0 12px;
          color: #fff;
          background: #294a70;
          height: 36px;
          display: flex;
          align-items: center;
        }

        .tl-search-input {
          border: none;
          outline: none;
          flex: 1;
          padding: 6px 10px;
          font-size: 0.83rem;
          color: #2c3e50;
          background: #fff;
        }

        .tl-search-clear {
          background: none;
          border: none;
          padding: 0 10px;
          color: #aab8c8;
          cursor: pointer;
          font-size: 12px;
          transition: color .15s;
        }

        .tl-search-clear:hover { color: #dc3545; }

        .tl-table-wrap {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e4ecf4;
          background: #fff;
        }

        .tl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .tl-table thead tr {
          background: #f5f8fc;
          border-bottom: 1.5px solid #e4ecf4;
        }

        .tl-table thead th {
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: #7a8fa6;
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .tl-table tbody tr {
          border-bottom: 1px solid #f0f4f9;
          transition: background .12s;
        }

        .tl-table tbody tr:last-child { border-bottom: none; }
        .tl-table tbody tr:hover { background: #f8fbff; }

        .tl-table td {
          padding: 10px 14px;
          vertical-align: middle;
          color: #2c3e50;
        }

        .tl-ticket-num {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          color: #5a7a99;
          font-weight: 600;
        }

        .tl-category-badge {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #e8f4fd;
          color: #1a6fa8;
        }

        .tl-request-text {
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.82rem;
          color: #3d5166;
        }

        .tl-date-text {
          white-space: nowrap;
          color: #5a7a99;
          font-size: 0.78rem;
        }

        .tl-action-group {
          display: inline-flex;
          gap: 4px;
          align-items: center;
        }

        .tl-icon-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1.5px solid;
          background: transparent;
          cursor: pointer;
          transition: background .15s, transform .1s;
          font-size: 12px;
        }

        .tl-icon-btn:hover { transform: translateY(-1px); }
        .tl-icon-btn-view   { border-color: #a8d8f0; color: #1a7ab8; }
        .tl-icon-btn-view:hover { background: #e6f4fb; }
        .tl-icon-btn-file   { border-color: #c8c8c8; color: #5a6a7a; }
        .tl-icon-btn-file:hover { background: #f0f0f0; }
        .tl-icon-btn-delete { border-color: #f5b8b3; color: #c0392b; }
        .tl-icon-btn-delete:hover { background: #fdecea; }

        .tl-empty {
          text-align: center;
          padding: 52px 0;
          color: #7a8fa6;
        }

        .tl-empty-icon { font-size: 2.2rem; margin-bottom: 10px; opacity: 0.4; }
      `}</style>

      <div className="tl-wrapper">
        {/* Header */}
        <div className="tl-header">
          <div className="tl-title-row">
            <h5 className="tl-title">
              {status} Tickets
              <span
                className="tl-status-pill"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                <span className="tl-status-dot" style={{ background: statusStyle.dot }} />
                {status}
              </span>
            </h5>
            <span className="tl-count-badge">{filteredTickets.length} Tickets</span>
          </div>

          {/* Search */}
          <div className="tl-search-wrap">
            <div className="tl-search-icon">
              <FaSearch size={12} />
            </div>
            <input
              className="tl-search-input"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="tl-search-clear" onClick={() => setSearchTerm("")} title="Clear">
                <FaTimes size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filteredTickets.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon">🔍</div>
            <h6 style={{ color: "#3d5166", fontWeight: 600 }}>
              {searchTerm ? "No tickets match your search." : `No ${status.toLowerCase()} tickets found.`}
            </h6>
            <p style={{ fontSize: "0.83rem" }}>Try adjusting your search term.</p>
          </div>
        ) : (
          <div
            className="tl-table-wrap"
            style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
          >
            <table className="tl-table">
              <thead>
                <tr>
                  <th>Ticket No.</th>
                  <th>Category</th>
                  <th>Request</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const hasAttachments =
                    ticket.attachments && JSON.parse(ticket.attachments).length > 0;
                  const canDelete = !NON_ARCHIVABLE_STATUSES.includes(status);

                  return (
                    <tr key={ticket.ticketNumber}>
                      <td>
                        <span className="tl-ticket-num">{ticket.ticketNumber}</span>
                      </td>
                      <td>
                        <span className="tl-category-badge">{ticket.category}</span>
                      </td>
                      <td>
                        <div className="tl-request-text" title={ticket.request}>
                          {ticket.request}
                        </div>
                      </td>
                      <td>
                        <span className="tl-date-text">
                          {new Date(ticket.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="tl-action-group">
                          <button
                            className="tl-icon-btn tl-icon-btn-view"
                            onClick={() => handleViewTicket(ticket)}
                            title="View ticket"
                          >
                            <FaEye size={12} />
                          </button>
                          {hasAttachments && (
                            <button
                              className="tl-icon-btn tl-icon-btn-file"
                              onClick={() => handleOpenAttachments(ticket.attachments)}
                              title="View attachments"
                            >
                              <FaPaperclip size={12} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="tl-icon-btn tl-icon-btn-delete"
                              onClick={() => handleArchiveTicket(ticket.ticketId)}
                              title="Delete ticket"
                            >
                              <FaTrash size={12} />
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
        )}
      </div>
    </>
  );
};

export default TicketList;