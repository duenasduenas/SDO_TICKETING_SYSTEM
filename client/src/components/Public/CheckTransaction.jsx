import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import Logo from "../../assets/SDO_Logo1.png";
import { FaArrowLeft, FaSearch } from "react-icons/fa";

const CheckTransaction = () => {
  const [transactionNumber, setTransactionNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":   return { bg: "#e6f9ed", color: "#1a7c3e", dot: "#28a745" };
      case "pending":     return { bg: "#fff8e6", color: "#8a6000", dot: "#ffc107" };
      case "in progress": return { bg: "#e6f0ff", color: "#0056b3", dot: "#007bff" };
      case "rejected":    return { bg: "#fdecea", color: "#b71c1c", dot: "#dc3545" };
      case "on hold":     return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
      default:            return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
    }
  };

  const handleCheckTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/depedacc/check-transaction?number=${transactionNumber}`
      );

      if (response.ok) {
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          Swal.fire({
            title: "Not Found",
            text: "No transaction found with that number.",
            icon: "error",
            confirmButtonText: "Close",
          });
          return;
        }

        const transaction = data[0];
        const st = getStatusStyle(transaction.status);

        let noteHtml = "";
        if (transaction.status?.toLowerCase() === "completed") {
          noteHtml = `
            <div style="display:flex;align-items:center;gap:8px;background:#e6f9ed;border:1px solid #b7eacc;border-radius:7px;padding:10px 14px;margin-top:14px;">
              <span style="font-size:1.1rem;">✉️</span>
              <span style="font-size:0.83rem;color:#1a7c3e;font-weight:600;">Email sent! Please check your inbox.</span>
            </div>`;
        } else if (transaction.status?.toLowerCase() === "rejected") {
          noteHtml = `
            <div style="background:#fdecea;border:1px solid #f5c6c3;border-radius:7px;padding:12px 14px;margin-top:14px;text-align:left;">
              <div style="font-size:0.78rem;font-weight:700;color:#b71c1c;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Request Rejected</div>
              <div style="font-size:0.83rem;color:#b71c1c;">Please submit a new request.</div>
              ${transaction.notes ? `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f5c6c3;">
                  <div style="font-size:0.72rem;font-weight:700;color:#7a8fa6;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Rejection Reason</div>
                  <div style="font-size:0.83rem;color:#3d5166;">${transaction.notes}</div>
                </div>` : ""}
            </div>`;
        }

        const rows = [
          { label: "Request No.", value: transaction.number || "N/A" },
          { label: "Name",        value: transaction.name   || "N/A" },
          { label: "School",      value: transaction.school || "N/A" },
        ];

        Swal.fire({
          title: `<span style="font-size:1rem;font-weight:700;color:#1a2e4a;">Transaction Details</span>`,
          html: `
            <div style="text-align:left;font-size:0.85rem;">
              <div style="background:#f5f8fc;border-radius:8px;padding:14px;margin-bottom:4px;">
                ${rows.map(r => `
                  <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f4f9;">
                    <span style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">${r.label}</span>
                    <span style="color:#1a2e4a;font-weight:600;font-size:0.83rem;">${r.value}</span>
                  </div>`).join("")}
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0 0;">
                  <span style="color:#7a8fa6;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Status</span>
                  <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:${st.bg};color:${st.color};">
                    <span style="width:7px;height:7px;border-radius:50%;background:${st.dot};display:inline-block;"></span>
                    ${transaction.status || "N/A"}
                  </span>
                </div>
              </div>
              ${noteHtml}
            </div>`,
          showConfirmButton: true,
          confirmButtonText: "Close",
          confirmButtonColor: "#1a2e4a",
          width: "480px",
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Error",
          text: errorData.error || "Failed to fetch transaction details",
          icon: "error",
          confirmButtonText: "Close",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "An error occurred while checking the transaction.",
        icon: "error",
        confirmButtonText: "Close",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .ct-input:focus {
          border-color: #294a70 !important;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
          outline: none;
        }
        .ct-btn:hover:not(:disabled) {
          background: #243f60 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }
        .ct-back:hover { color: #1a2e4a !important; }
        .ct-spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: ctSpin .7s linear infinite; vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes ctSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#f0f4f9",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Top bar */}
        <div style={{ background: "#1a2e4a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <img src={Logo} alt="SDO" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>SDO Cabuyao</span>
          <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>Check Transaction Status</span>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
          <div style={{ width: "100%", maxWidth: 440 }}>

            {/* Back link */}
            <Link
              to="/"
              className="ct-back"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#995a5a", textDecoration: "none", marginBottom: 20, transition: "color .15s" }}
            >
              <FaArrowLeft size={11} /> Back to Login
            </Link>

            {/* Card */}
            <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(26,46,74,0.07)" }}>

              {/* Card header */}
              <div style={{ background: "#1a2e4a", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FaSearch size={14} style={{ color: "rgba(255,255,255,0.65)" }} />
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.92rem" }}>Check Transaction Status</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", margin: "4px 0 0" }}>
                  Enter your request number to view the current status.
                </p>
              </div>

              {/* Form body */}
              <div style={{ padding: "28px 24px 32px" }}>
                <form onSubmit={handleCheckTransaction} noValidate>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#7a8fa6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                      Request Number <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      className="ct-input"
                      type="text"
                      placeholder="e.g. #REQ-2025-00001"
                      value={transactionNumber}
                      onChange={(e) => setTransactionNumber(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        height: 42,
                        border: "1.5px solid #d0dbe8",
                        borderRadius: 8,
                        padding: "0 14px",
                        fontSize: "0.88rem",
                        color: "#2c3e50",
                        background: "#fff",
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                        transition: "border-color .15s, box-shadow .15s",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="ct-btn"
                    disabled={loading || !transactionNumber.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      height: 42,
                      background: "#1a2e4a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      cursor: loading || !transactionNumber.trim() ? "not-allowed" : "pointer",
                      opacity: loading || !transactionNumber.trim() ? 0.65 : 1,
                      transition: "background .2s, transform .15s, box-shadow .2s",
                      fontFamily: "'Segoe UI', system-ui, sans-serif",
                    }}
                  >
                    {loading ? (
                      <><span className="ct-spin" />Checking…</>
                    ) : (
                      <><FaSearch size={13} /> Check Status</>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #f0f4f9", margin: "24px 0 16px" }} />

                {/* Info note */}
                <p style={{ fontSize: "0.75rem", color: "#7a8fa6", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
                  Your request number was provided when you submitted your account request.
                  <br />If you didn't note it down, please contact your SDO administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckTransaction;