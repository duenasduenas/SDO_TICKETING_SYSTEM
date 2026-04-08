import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { FaEye, FaPaperclip, FaTrash, FaSyncAlt, FaChartBar } from "react-icons/fa";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const NewAccountRequests = ({
  newAccountRequests,
  loading,
  filterStatus,
  searchTerm,
  filterMonth,
  filterYear,
  fetchNewAccountRequests,
}) => {
  const [error, setError] = useState("");
  const [showGraph, setShowGraph] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");

  const getFileIcon = (filename) => {
    if (!filename) return "❓";
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "doc": case "docx": return "📝";
      case "xls": case "xlsx": return "📊";
      case "jpg": case "jpeg": case "png": return "🖼️";
      default: return "📎";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return "#28a745";
      case "pending": return "#ffc107";
      case "on hold": return "#6c757d";
      case "in progress": return "#007bff";
      case "rejected": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusBgLight = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return { bg: "#e6f9ed", color: "#1a7c3e", dot: "#28a745" };
      case "pending":   return { bg: "#fff8e6", color: "#8a6000", dot: "#ffc107" };
      case "on hold":   return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
      case "in progress": return { bg: "#e6f0ff", color: "#0056b3", dot: "#007bff" };
      case "rejected":  return { bg: "#fdecea", color: "#b71c1c", dot: "#dc3545" };
      default:          return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
    }
  };

  const formatMiddleName = (middleName) =>
    middleName && middleName.trim() !== "" ? middleName : "N/A";

  const accountStatusOptions = ["Completed", "Pending", "In Progress", "Rejected"];

  const handleOpenFiles = (request) => {
    const files = {
      endorsement_letter: request.endorsement_letter || "",
      prc_id: request.prc_id || "",
      proof_of_identity: request.proof_of_identity || "",
    };
    const validFiles = Object.entries(files).filter(([, filename]) => filename);

    const filesHTML = `
      <div class="files-container">
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          ${validFiles.map(([, filename]) => {
            const icon = getFileIcon(filename);
            return `
              <div class="col">
                <div class="card h-100">
                  <div class="card-body d-flex flex-column">
                    <div class="text-center mb-3"><span style="font-size:2.5rem;">${icon}</span></div>
                    <h5 class="card-title text-truncate mb-3" title="${filename}">${filename}</h5>
                    <div class="mt-auto">
                      <button class="btn btn-primary btn-sm w-100 open-file" data-filename="${filename}">Open File</button>
                    </div>
                  </div>
                </div>
              </div>`;
          }).join("")}
        </div>
      </div>`;

    Swal.fire({
      title: "Account Request Files",
      html: filesHTML,
      width: "80%",
      didOpen: () => {
        document.querySelectorAll(".open-file").forEach((button) => {
          button.addEventListener("click", () => {
            const filename = button.getAttribute("data-filename");
            window.open(`${API_BASE_URL}/api/depedacc/${filename}`, "_blank");
          });
        });
      },
    });
  };

  const handleDeleteNewAccountRequest = async (request) => {
    try {
      const result = await Swal.fire({
        title: "Delete Request",
        text: `Are you sure you want to delete request ${request.requestNumber}? This cannot be undone.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;

      await axios.put(
        `${API_BASE_URL}/api/depedacc/deped-account-requests/${request.id}/status`,
        { status: "Rejected", email_reject_reason: "Deleted by admin" }
      );
      await fetchNewAccountRequests();
      Swal.fire({ title: "Deleted", text: "Account request has been deleted.", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (err) {
      setError("Failed to delete account request");
      Swal.fire({ title: "Error", text: "Failed to delete account request", icon: "error" });
    }
  };

  const handleUpdateNewAccountStatus = async (requestId, newStatus) => {
    try {
      let rejectionReason = "";
      if (newStatus.toLowerCase() === "rejected") {
        const { value: reason } = await Swal.fire({
          title: "Rejection Reason",
          input: "textarea",
          inputLabel: "Please specify the reason for rejection",
          inputPlaceholder: "Enter rejection reason here...",
          showCancelButton: true,
          inputValidator: (value) => { if (!value) return "You need to provide a rejection reason!"; },
        });
        if (!reason) return;
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
          `${API_BASE_URL}/api/depedacc/deped-account-requests/${requestId}/status`,
          { status: newStatus, email_reject_reason: rejectionReason }
        );
        await fetchNewAccountRequests();
        Swal.fire({ title: "Status Updated", text: `Request status has been updated to ${newStatus}`, icon: "success", timer: 2000, showConfirmButton: false });
      }
    } catch {
      setError("Failed to update request status");
      Swal.fire({ title: "Error", text: "Failed to update request status", icon: "error" });
    }
  };

  const handleShowNewRequestDetails = (request) => {
    const statusOptionsHTML = accountStatusOptions
      .filter((s) => s.toLowerCase() !== request.status.toLowerCase())
      .map((s) => `<option value="${s}" style="color:black;">${s}</option>`)
      .join("");

    const currentStatusBadge = `
      <div class="current-status-badge mb-3">
        <span class="badge rounded-pill" style="background-color:${getStatusColor(request.status)};font-size:0.9rem;padding:0.5em 1em;">
          Current Status: ${request.status}
        </span>
      </div>`;

    const rejectionReasonSection =
      request.status.toLowerCase() === "rejected" && request.email_reject_reason
        ? `<div class="row mb-2">
            <div class="col-md-3 fw-bold">Rejection Reason:</div>
            <div class="col-md-9 text-danger rejection-reason">${request.email_reject_reason}</div>
           </div>`
        : "";

    const files = {
      endorsement_letter: request.endorsement_letter || "",
      prc_id: request.prc_id || "",
      proof_of_identity: request.proof_of_identity || "",
    };
    const fileCount = Object.values(files).filter((f) => f).length;
    const attachmentsButton = fileCount > 0
      ? `<button class="btn btn-outline-secondary mt-3 view-attachments"><i class="fas fa-paperclip"></i> View Attachments (${fileCount})</button>`
      : "";

    Swal.fire({
      title: `Request ID: ${request.id}`,
      html: `
        <div class="request-details text-start">
          <div class="request-info mb-4">
            <div class="row mb-2"><div class="col-md-3 fw-bold">Account Type:</div><div class="col-md-9">${request.selected_type}</div></div>
            ${rejectionReasonSection}
            <div class="row mb-2"><div class="col-md-3 fw-bold">Last Name:</div><div class="col-md-9">${request.surname}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">First Name:</div><div class="col-md-9">${request.first_name}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">Middle Name:</div><div class="col-md-9">${formatMiddleName(request.middle_name)}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">Designation:</div><div class="col-md-9">${request.designation}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">School:</div><div class="col-md-9">${request.school}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">School ID:</div><div class="col-md-9">${request.school_id}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">Personal Gmail:</div><div class="col-md-9">${request.personal_gmail}</div></div>
            <div class="row mb-2"><div class="col-md-3 fw-bold">Date Created:</div><div class="col-md-9">${new Date(request.created_at).toLocaleString()}</div></div>
          </div>
          <div class="d-flex justify-content-between status-update">
            <div><h5>Status:</h5></div>
            <div class="text-center">${currentStatusBadge}</div>
          </div>
          <div class="d-flex justify-content-between mb-4">
            <div><h5>Update Status:</h5></div>
            <div>
              <select id="statusDropdown" class="form-select status-dropdown" style="width:150px;">
                <option value="" selected disabled>Change Status</option>
                ${statusOptionsHTML}
              </select>
            </div>
          </div>
          <div class="d-flex justify-content-center">
            <button id="updateStatusBtn" class="btn btn-outline-dark update-status-btn">Update Status</button>
          </div>
          <div class="text-center mt-4">${attachmentsButton}</div>
        </div>`,
      width: "700px",
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        document.getElementById("updateStatusBtn").addEventListener("click", () => {
          const selectedStatus = document.getElementById("statusDropdown").value;
          if (selectedStatus) handleUpdateNewAccountStatus(request.id, selectedStatus);
          else Swal.showValidationMessage("Please select a status");
        });
        const attachmentsBtn = document.querySelector(".view-attachments");
        if (attachmentsBtn) attachmentsBtn.addEventListener("click", () => handleOpenFiles(request));
      },
    });
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const baseRequests = newAccountRequests
    .filter((r) => {
      if (r.status?.toLowerCase() === "rejected" && r.email_reject_reason === "Deleted by admin") return false;
      if (filterStatus === "all") return true;
      return r.status?.toLowerCase() === filterStatus.toLowerCase();
    })
    .filter((r) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        String(r.requestNumber ?? "").toLowerCase().includes(s) ||
        String(r.id ?? "").toLowerCase().includes(s) ||
        r.selected_type?.toLowerCase().includes(s) ||
        r.first_name?.toLowerCase().includes(s) ||
        r.surname?.toLowerCase().includes(s) ||
        r.middle_name?.toLowerCase().includes(s) ||
        r.school?.toLowerCase().includes(s)
      );
    })
    .filter((r) => {
      if (!filterMonth || filterMonth === "all") return true;
      if (!r.created_at) return false;
      return new Date(r.created_at).getMonth() + 1 === Number(filterMonth);
    })
    .filter((r) => {
      if (!filterYear) return true;
      if (!r.created_at) return false;
      return new Date(r.created_at).getFullYear() === Number(filterYear);
    });

  const filteredNewAccountRequests = baseRequests
    .filter((r) => {
      if (activeStatusFilter === "all") return true;
      return r.status?.toLowerCase() === activeStatusFilter.toLowerCase();
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      if (dateB - dateA !== 0) return dateB - dateA;
      return (b.id ?? 0) - (a.id ?? 0);
    });

  const statusCounts = accountStatusOptions.reduce((acc, s) => {
    acc[s] = baseRequests.filter((r) => r.status?.toLowerCase() === s.toLowerCase()).length;
    return acc;
  }, {});

  // ── Chart ──────────────────────────────────────────────────────────────────
  const statusChartConfig = (() => {
    if (!filteredNewAccountRequests.length) return { data: null, options: {} };

    const sorted = [...filteredNewAccountRequests].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const dateLabels = [];
    const dateKeyToIndex = new Map();
    sorted.forEach((req) => {
      if (!req.created_at) return;
      const key = new Date(req.created_at).toISOString().split("T")[0];
      if (!dateKeyToIndex.has(key)) {
        dateKeyToIndex.set(key, dateLabels.length);
        dateLabels.push(new Date(req.created_at).toLocaleDateString());
      }
    });

    const statuses = ["Completed", "Pending", "In Progress", "Rejected"];
    const statusColors = { Completed: "#28a745", Pending: "#ffc107", "In Progress": "#007bff", Rejected: "#dc3545" };
    const countsByStatus = {};
    statuses.forEach((s) => { countsByStatus[s] = new Array(dateLabels.length).fill(0); });

    sorted.forEach((req) => {
      if (!req.created_at || !req.status) return;
      const key = new Date(req.created_at).toISOString().split("T")[0];
      const idx = dateKeyToIndex.get(key);
      if (idx === undefined) return;
      const norm = req.status.toLowerCase();
      const sk =
        norm === "completed" ? "Completed" :
        norm === "pending" ? "Pending" :
        norm === "in progress" ? "In Progress" :
        norm === "rejected" ? "Rejected" : null;
      if (sk) countsByStatus[sk][idx] += 1;
    });

    return {
      data: {
        labels: dateLabels,
        datasets: statuses.map((s) => ({
          label: s,
          data: countsByStatus[s],
          backgroundColor: statusColors[s],
          borderColor: statusColors[s],
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "New Account Requests by Status" },
        },
        scales: {
          x: { title: { display: true, text: "Date" } },
          y: { beginAtZero: true, title: { display: true, text: "Number of Requests" }, ticks: { precision: 0 } },
        },
      },
    };
  })();

  // ── Pill styles ────────────────────────────────────────────────────────────
  const pillStyles = {
    Completed:     { bg: "#e6f9ed", color: "#1a7c3e", border: "#b7eacc" },
    Pending:       { bg: "#fff8e6", color: "#8a6000", border: "#ffe8a3" },
    "In Progress": { bg: "#e6f0ff", color: "#0056b3", border: "#b3d0ff" },
    Rejected:      { bg: "#fdecea", color: "#b71c1c", border: "#f5c6c3" },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .nar-wrapper { font-family: 'Segoe UI', system-ui, sans-serif; }
        .nar-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .nar-title { font-size:1.2rem; font-weight:700; color:#1a2e4a; margin:0; }
        .nar-result-count { font-size:0.82rem; color:#7a8fa6; margin-bottom:12px; }
        .nar-action-btns { display:flex; gap:8px; }
        .nar-btn {
          display:inline-flex; align-items:center; gap:5px;
          font-size:0.8rem; font-weight:500; padding:5px 13px;
          border-radius:6px; border:1.5px solid #d0dbe8;
          background:#fff; color:#334e68; cursor:pointer;
          transition:background .15s, border-color .15s;
        }
        .nar-btn:hover { background:#f0f5fb; border-color:#b0c4d8; }
        .nar-status-pills { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
        .nar-pill {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 14px; border-radius:20px;
          font-size:0.82rem; font-weight:600;
          border:1.5px solid transparent;
          cursor:pointer;
          transition:opacity .15s, box-shadow .15s, transform .1s;
          user-select:none;
        }
        .nar-pill:hover { opacity:0.85; transform:translateY(-1px); }
        .nar-pill.nar-pill-active { box-shadow:0 0 0 2.5px currentColor; }
        .nar-pill-all { background:#f0f4f9; color:#3d5166; border-color:#d0dbe8; }
        .nar-pill-all.nar-pill-active { box-shadow:0 0 0 2.5px #3d5166; }
        .nar-pill-count { font-size:1rem; font-weight:700; margin-right:2px; }
        .nar-table-wrap { border-radius:8px; overflow:hidden; border:1px solid #e4ecf4; }
        .nar-table { width:100%; border-collapse:collapse; font-size:0.82rem; background:#fff; }
        .nar-table thead tr { background:#f5f8fc; border-bottom:1.5px solid #e4ecf4; }
        .nar-table thead th {
          padding:10px 12px; text-align:left; font-weight:600;
          color:#7a8fa6; text-transform:uppercase;
          font-size:0.72rem; letter-spacing:0.04em; white-space:nowrap;
        }
        .nar-table tbody tr { border-bottom:1px solid #f0f4f9; transition:background .12s; }
        .nar-table tbody tr:last-child { border-bottom:none; }
        .nar-table tbody tr:hover { background:#f8fbff; }
        .nar-table td { padding:9px 12px; color:#2c3e50; vertical-align:middle; }
        .nar-req-num { font-family:'Courier New',monospace; font-size:0.75rem; color:#5a7a99; font-weight:600; }
        .nar-type-badge { display:inline-block; padding:2px 9px; border-radius:4px; font-size:0.75rem; font-weight:600; }
        .nar-type-gmail  { background:#fce8e6; color:#c0392b; }
        .nar-type-office { background:#e8f4fd; color:#1a6fa8; }
        .nar-type-deped  { background:#e8f9ef; color:#1a7c3e; }
        .nar-name-bold { font-weight:600; color:#1a2e4a; }
        .nar-email-text { color:#5a7a99; font-size:0.78rem; }
        .nar-status-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; white-space:nowrap; }
        .nar-status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
        .nar-action-group { display:inline-flex; gap:4px; align-items:center; }
        .nar-icon-btn { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; border:1.5px solid; background:transparent; cursor:pointer; transition:background .15s, transform .1s; font-size:12px; }
        .nar-icon-btn:hover { transform:translateY(-1px); }
        .nar-icon-btn-view   { border-color:#a8d8f0; color:#1a7ab8; }
        .nar-icon-btn-view:hover  { background:#e6f4fb; }
        .nar-icon-btn-file   { border-color:#c8c8c8; color:#5a6a7a; }
        .nar-icon-btn-file:hover  { background:#f0f0f0; }
        .nar-icon-btn-delete { border-color:#f5b8b3; color:#c0392b; }
        .nar-icon-btn-delete:hover { background:#fdecea; }
        .nar-empty { text-align:center; padding:48px 0; color:#7a8fa6; }
        .nar-empty-icon { font-size:2.2rem; margin-bottom:10px; opacity:0.4; }
        .rejection-reason { background:#fff8f8; border-left:4px solid #dc3545; padding:0.5rem; margin:0.5rem 0; border-radius:4px; }
      `}</style>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#294a70" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2" style={{ color: "#7a8fa6", fontSize: "0.9rem" }}>Loading requests...</p>
        </div>
      ) : (
        <div className="nar-wrapper">
          <div className="nar-header-row">
            <h5 className="nar-title">New Account Requests</h5>
            <div className="nar-action-btns">
              <button className="nar-btn" onClick={fetchNewAccountRequests}>
                <FaSyncAlt size={11} /> Refresh
              </button>
              <button className="nar-btn" onClick={() => setShowGraph(true)}>
                <FaChartBar size={11} /> View Graph
              </button>
            </div>
          </div>

          <div className="nar-result-count">
            {filteredNewAccountRequests.length} result{filteredNewAccountRequests.length !== 1 ? "s" : ""} found
          </div>

          {/* Status Pills */}
          <div className="nar-status-pills">
            <span
              className={`nar-pill nar-pill-all${activeStatusFilter === "all" ? " nar-pill-active" : ""}`}
              onClick={() => setActiveStatusFilter("all")}
              title="Show all requests"
            >
              <span className="nar-pill-count">{baseRequests.length}</span>
              All
            </span>

            {accountStatusOptions.map((s) => {
              const p = pillStyles[s] || { bg: "#f0f0f0", color: "#555", border: "#ddd" };
              const isActive = activeStatusFilter.toLowerCase() === s.toLowerCase();
              return (
                <span
                  key={s}
                  className={`nar-pill${isActive ? " nar-pill-active" : ""}`}
                  style={{ background: p.bg, color: p.color, borderColor: p.border }}
                  onClick={() => setActiveStatusFilter(isActive ? "all" : s)}
                  title={`Filter by ${s}`}
                >
                  <span className="nar-pill-count">{statusCounts[s] ?? 0}</span>
                  {s}
                </span>
              );
            })}
          </div>

          {/* Table */}
          {filteredNewAccountRequests.length > 0 ? (
            <div className="nar-table-wrap">
              <table className="nar-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Personal Email</th>
                    <th>School</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNewAccountRequests.map((request) => {
                    const statusStyle = getStatusBgLight(request.status);
                    const typeLower = (request.selected_type || "").toLowerCase();
                    const typeClass = typeLower.includes("gmail")
                      ? "nar-type-gmail"
                      : typeLower.includes("office") || typeLower.includes("365")
                      ? "nar-type-office"
                      : "nar-type-deped";

                    const files = {
                      endorsement_letter: request.endorsement_letter || "",
                      prc_id: request.prc_id || "",
                      proof_of_identity: request.proof_of_identity || "",
                    };
                    const fileCount = Object.values(files).filter((f) => f).length;
                    const isCompleted = request.status?.toLowerCase() === "completed";

                    const fullName = [
                      request.first_name,
                      formatMiddleName(request.middle_name) !== "N/A" ? request.middle_name : "",
                      request.surname,
                    ].filter(Boolean).join(" ").toUpperCase();

                    return (
                      <tr key={request.id}>
                        <td><span className="nar-req-num">{request.requestNumber || `#${request.id}`}</span></td>
                        <td><span className={`nar-type-badge ${typeClass}`}>{request.selected_type || "—"}</span></td>
                        <td><span className="nar-name-bold">{fullName}</span></td>
                        <td><span className="nar-email-text">{request.personal_gmail || "—"}</span></td>
                        <td style={{ maxWidth: 180 }}>
                          <span style={{ fontSize: "0.8rem", color: "#3d5166" }}>{request.school || "—"}</span>
                        </td>
                        <td>
                          <span className="nar-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            <span className="nar-status-dot" style={{ background: statusStyle.dot }} />
                            {request.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap", color: "#5a7a99", fontSize: "0.78rem" }}>
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="nar-action-group">
                            <button className="nar-icon-btn nar-icon-btn-view" onClick={() => handleShowNewRequestDetails(request)} title="View details">
                              <FaEye size={12} />
                            </button>
                            {fileCount > 0 && !isCompleted && (
                              <button className="nar-icon-btn nar-icon-btn-file" onClick={() => handleOpenFiles(request)} title={`View files (${fileCount})`}>
                                <FaPaperclip size={12} />
                              </button>
                            )}
                            <button className="nar-icon-btn nar-icon-btn-delete" onClick={() => handleDeleteNewAccountRequest(request)} title="Delete request">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="nar-empty">
              <div className="nar-empty-icon">🔍</div>
              <h6 style={{ color: "#3d5166", fontWeight: 600 }}>No new account requests found</h6>
              <p style={{ fontSize: "0.83rem" }}>Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      )}

      {/* Graph Modal */}
      <Modal show={showGraph} onHide={() => setShowGraph(false)} size="xl" centered>
        <Modal.Header style={{ fontSize: "16px", fontWeight: 700, background: "#243f60" }} closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
            Status Graph — New Account Requests
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statusChartConfig.data ? (
            <div style={{ height: "450px" }}>
              <Bar data={statusChartConfig.data} options={statusChartConfig.options} />
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: "#7a8fa6" }}>
              No data available for the selected filters.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NewAccountRequests;