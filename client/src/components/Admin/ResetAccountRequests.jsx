import React, { useState } from "react";
import { Badge, Modal } from "react-bootstrap";
import { Eye, Trash2, BarChart2, SearchX, RefreshCw } from "lucide-react";
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

const STATUS_CONFIG = {
  completed:   { label: "Completed",   color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  pending:     { label: "Pending",     color: "#d97706", bg: "#fef9c3", border: "#fde047" },
  "in progress":{ label: "In Progress", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  rejected:    { label: "Rejected",    color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};

const getStatusConfig = (status = "") =>
  STATUS_CONFIG[status.toLowerCase()] || { label: status, color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" };

const StatusBadge = ({ status }) => {
  const cfg = getStatusConfig(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }}></span>
      {cfg.label}
    </span>
  );
};

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
  const [activeFilter, setActiveFilter] = useState("all");

  const accountStatusOptions = ["Completed", "Pending", "In Progress", "Rejected"];

  const formatMiddleName = (m) => (m && m.trim() !== "" ? m : "—");
  const formatEmail = (e) => (e && e.trim() !== "" ? e : "—");
  const getPersonalEmail = (r) => r.reset_email || r.personalEmail || "—";
  const getDepedEmail = (r) => r.deped_email || "—";

  const handleDeleteResetAccountRequest = async (request) => {
    try {
      const result = await Swal.fire({
        title: "Delete Reset Request",
        text: `Are you sure you want to delete request #${request.resetNumber || request.id}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;
      await axios.put(
        `${API_BASE_URL}/api/depedacc/deped-account-reset-requests/${request.id}/status`,
        { status: "Rejected", notes: "Deleted by admin" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      await fetchResetAccountRequests();
      Swal.fire({ title: "Deleted", text: "Request has been deleted.", icon: "success", timer: 2000, showConfirmButton: false });
    } catch {
      setError("Failed to delete reset account request");
    }
  };

  const handleUpdateResetAccountStatus = async (requestId, newStatus) => {
    try {
      let rejectionReason = "";
      if (newStatus.toLowerCase() === "rejected") {
        const { value: reason, isDismissed } = await Swal.fire({
          title: "Rejection Reason",
          input: "textarea",
          inputLabel: "Please specify the reason for rejection",
          inputPlaceholder: "Enter rejection reason here...",
          showCancelButton: true,
          inputValidator: (v) => !v && "You need to provide a rejection reason!",
        });
        if (isDismissed || !reason) return;
        rejectionReason = reason;
      }
      const result = await Swal.fire({
        title: "Update Status",
        text: `Mark this request as ${newStatus}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: getStatusConfig(newStatus).color,
        confirmButtonText: `Yes, mark as ${newStatus}`,
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;
      await axios.put(
        `${API_BASE_URL}/api/depedacc/deped-account-reset-requests/${requestId}/status`,
        { status: newStatus, notes: rejectionReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      await fetchResetAccountRequests();
      Swal.fire({ title: "Updated", text: `Status updated to ${newStatus}`, icon: "success", timer: 2000, showConfirmButton: false });
    } catch {
      setError("Failed to update request status");
    }
  };

  const handleShowRequestDetails = (request) => {
    const cfg = getStatusConfig(request.status);
    const statusOptionsHTML = accountStatusOptions
      .filter((s) => s.toLowerCase() !== request.status.toLowerCase())
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");

    const rejectionSection = request.status.toLowerCase() === "rejected" && request.notes
      ? `<div style="background:#fff5f5;border-left:4px solid #dc2626;padding:10px 14px;border-radius:6px;margin-bottom:12px;">
           <div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:4px;">Rejection Reason</div>
           <div style="color:#374151;">${request.notes}</div>
         </div>`
      : "";

    const row = (label, value) =>
      `<div style="display:flex;padding:8px 0;border-bottom:1px solid #f3f4f6;">
         <div style="width:40%;font-weight:600;color:#6b7280;font-size:13px;">${label}</div>
         <div style="width:60%;color:#111827;font-size:13px;">${value}</div>
       </div>`;

    Swal.fire({
      title: `<span style="font-size:16px;font-weight:700;color:#111827;">Reset Request #${request.resetNumber || request.id}</span>`,
      html: `
        <div style="text-align:left;">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;
            color:${cfg.color};background:${cfg.bg};border:1px solid ${cfg.border};margin-bottom:16px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${cfg.color};display:inline-block;"></span>
            ${cfg.label}
          </div>
          ${rejectionSection}
          <div style="margin-bottom:16px;">
            ${row("Account Type", request.selected_type)}
            ${row("Last Name", request.surname)}
            ${row("First Name", request.first_name)}
            ${row("Middle Name", formatMiddleName(request.middle_name))}
            ${row("Personal Email", formatEmail(getPersonalEmail(request)))}
            ${row("DepEd Email", formatEmail(getDepedEmail(request)))}
            ${row("School", request.school)}
            ${request.school_id ? row("School ID", request.school_id) : ""}
            ${row("Employee No.", request.employee_number)}
            ${row("Date Created", new Date(request.created_at).toLocaleString())}
          </div>
          <div style="background:#f8fafc;border-radius:8px;padding:14px;">
            <div style="font-weight:600;color:#374151;font-size:13px;margin-bottom:8px;">Update Status</div>
            <div style="display:flex;gap:8px;">
              <select id="statusDropdown" style="flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;background:white;">
                <option value="" disabled selected>Select new status...</option>
                ${statusOptionsHTML}
              </select>
              <button id="updateStatusBtn" style="padding:8px 16px;background:#1d4ed8;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
                Update
              </button>
            </div>
          </div>
        </div>
      `,
      width: "600px",
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        document.getElementById("updateStatusBtn").addEventListener("click", () => {
          const val = document.getElementById("statusDropdown").value;
          if (val) handleUpdateResetAccountStatus(request.id, val);
          else Swal.showValidationMessage("Please select a status");
        });
      },
    });
  };

// AFTER
  const filteredRequests = resetAccountRequests
    .filter((r) => !(r.status?.toLowerCase() === "rejected" && r.notes === "Deleted by admin"))
    .filter((r) => filterStatus === "all" || r.status?.toLowerCase() === filterStatus.toLowerCase())
    .filter((r) => activeFilter === "all" || r.status?.toLowerCase() === activeFilter.toLowerCase())
    .filter((r) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        String(r.resetNumber || r.id).toLowerCase().includes(s) ||
        r.selected_type?.toLowerCase().includes(s) ||
        r.first_name?.toLowerCase().includes(s) ||
        r.surname?.toLowerCase().includes(s) ||
        r.middle_name?.toLowerCase().includes(s) ||
        r.reset_email?.toLowerCase().includes(s) ||
        r.personalEmail?.toLowerCase().includes(s) ||
        r.deped_email?.toLowerCase().includes(s) ||
        r.school?.toLowerCase().includes(s)
      );
    })
    .filter((r) => {
      if (!filterMonth || filterMonth === "all") return true;
      return new Date(r.created_at).getMonth() + 1 === Number(filterMonth);
    })
    .filter((r) => {
      if (!filterYear) return true;
      return new Date(r.created_at).getFullYear() === Number(filterYear);
    });

  // Chart config
  const statusChartConfig = (() => {
    if (!filteredRequests.length) return { data: null, options: {} };
    const sorted = [...filteredRequests].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const dateLabels = [];
    const dateKeyToIndex = new Map();
    sorted.forEach((r) => {
      if (!r.created_at) return;
      const key = new Date(r.created_at).toISOString().split("T")[0];
      if (!dateKeyToIndex.has(key)) {
        dateKeyToIndex.set(key, dateLabels.length);
        dateLabels.push(new Date(r.created_at).toLocaleDateString());
      }
    });
    const statuses = ["Completed", "Pending", "In Progress", "Rejected"];
    const colors = { Completed: "#16a34a", Pending: "#d97706", "In Progress": "#2563eb", Rejected: "#dc2626" };
    const counts = {};
    statuses.forEach((s) => (counts[s] = new Array(dateLabels.length).fill(0)));
    sorted.forEach((r) => {
      if (!r.created_at || !r.status) return;
      const key = new Date(r.created_at).toISOString().split("T")[0];
      const idx = dateKeyToIndex.get(key);
      const sk = statuses.find((s) => s.toLowerCase() === r.status.toLowerCase());
      if (sk !== undefined && idx !== undefined) counts[sk][idx] += 1;
    });
    return {
      data: {
        labels: dateLabels,
        datasets: statuses.map((s) => ({ label: s, data: counts[s], backgroundColor: colors[s], borderColor: colors[s], borderWidth: 1 })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" }, title: { display: true, text: "Reset Account Requests by Status" } },
        scales: {
          x: { title: { display: true, text: "Date" } },
          y: { beginAtZero: true, title: { display: true, text: "Number of Requests" }, ticks: { precision: 0 } },
        },
      },
    };
  })();

  const statusCounts = {
    completed: filteredRequests.filter((r) => r.status?.toLowerCase() === "completed").length,
    pending: filteredRequests.filter((r) => r.status?.toLowerCase() === "pending").length,
    inProgress: filteredRequests.filter((r) => r.status?.toLowerCase() === "in progress").length,
    rejected: filteredRequests.filter((r) => r.status?.toLowerCase() === "rejected").length,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div className="spinner-border text-primary" role="status"></div>
        <p style={{ color: "#6b7280", marginTop: "12px", fontSize: "14px" }}>Loading requests...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h5 style={{ color: "#111827", fontWeight: 700, margin: 0 }}>Reset Account Requests</h5>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "2px 0 0" }}>{filteredRequests.length} result{filteredRequests.length !== 1 ? "s" : ""} found</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => fetchResetAccountRequests()}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", border: "1px solid #d1d5db", borderRadius: "7px", background: "white", fontSize: "13px", cursor: "pointer", color: "#374151" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowGraph(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", border: "1px solid #d1d5db", borderRadius: "7px", background: "white", fontSize: "13px", cursor: "pointer", color: "#374151" }}
          >
            <BarChart2 size={13} /> View Graph
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {/* "All" pill */}
        {(() => {
          const isActive = activeFilter === "all";
          return (
            <button
              key="all"
              onClick={() => setActiveFilter("all")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: isActive ? "#1e293b" : "white",
                color: isActive ? "white" : "#374151",
                border: `2px solid ${isActive ? "#1e293b" : "#d1d5db"}`,
              }}
            >
              <span style={{ fontWeight: 700 }}>{filteredRequests.length + (activeFilter !== "all" ? 0 : 0)}</span>
              All
            </button>
          );
        })()}

        {/* Status pills */}
        {[
          { key: "completed",   label: "Completed",   count: statusCounts.completed,   ...STATUS_CONFIG.completed },
          { key: "pending",     label: "Pending",     count: statusCounts.pending,     ...STATUS_CONFIG.pending },
          { key: "in progress", label: "In Progress", count: statusCounts.inProgress,  ...STATUS_CONFIG["in progress"] },
          { key: "rejected",    label: "Rejected",    count: statusCounts.rejected,    ...STATUS_CONFIG.rejected },
        ].map((s) => {
          const isActive = activeFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveFilter(isActive ? "all" : s.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: isActive ? s.bg : "white",
                color: s.color,
                border: `2px solid ${isActive ? s.color : "#d1d5db"}`,
                boxShadow: isActive ? `0 0 0 3px ${s.bg}` : "none",
              }}
            >
              <span style={{ fontWeight: 700 }}>{s.count}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {filteredRequests.length > 0 ? (
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  {["#", "Type", "Name", "Personal Email", "DepEd Email", "School", "Status", "Date", "Action"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, idx) => (
                  <tr
                    key={request.id}
                    style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "white" : "#fafafa", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0f7ff"}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa"}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#374151" }}>
                      #{request.resetNumber || request.id}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>
                      <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500 }}>
                        {request.selected_type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {request.first_name} {formatMiddleName(request.middle_name) !== "—" ? request.middle_name + " " : ""}{request.surname}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formatEmail(getPersonalEmail(request))}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formatEmail(getDepedEmail(request))}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {request.school}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={request.status} />
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() => handleShowRequestDetails(request)}
                        title="View details"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", border: "1px solid #bfdbfe", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", cursor: "pointer" }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <SearchX size={40} style={{ color: "#d1d5db", marginBottom: "12px" }} />
          <h6 style={{ color: "#374151", fontWeight: 600 }}>No reset account requests found</h6>
          <p style={{ color: "#9ca3af", fontSize: "13px" }}>Try adjusting your filters or search term</p>
        </div>
      )}

      {/* Graph Modal */}
      <Modal show={showGraph} onHide={() => setShowGraph(false)} size="xl" centered>
        <Modal.Header style={{ fontSize: "16px", fontWeight: 700, background: "#243f60"}} closeButton>
          <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#fff"}}>Status Graph — Reset Account Requests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statusChartConfig.data ? (
            <div style={{ height: "450px" }}>
              <Bar data={statusChartConfig.data} options={statusChartConfig.options} />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No data available for the selected filters.</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ResetAccountRequests;