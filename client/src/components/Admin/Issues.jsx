import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaPlus } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const Issues = ({ filterStatus = "all", searchTerm = "" }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newIssueName, setNewIssueName] = useState("");
  const [issueCategory, setIssueCategory] = useState("hardware");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/ticket/issues`);
      setIssues(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError("Failed to load issues. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleAddIssue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!newIssueName || newIssueName.trim() === "") {
      setError("Issue name cannot be empty");
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/ticket/addIssue`, {
        issue_name: newIssueName.trim(),
        issue_category: issueCategory,
      });
      Swal.fire({ icon: "success", title: "Success!", text: "Issue added successfully!", timer: 2000, showConfirmButton: false });
      setNewIssueName("");
      setIssueCategory("hardware");
      fetchIssues();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || "Failed to add issue." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!issueId || isNaN(Number(issueId))) {
      Swal.fire({ icon: "error", title: "Error", text: "Invalid issue ID" });
      return;
    }

    const result = await Swal.fire({
      title: "Delete Issue",
      text: "Are you sure you want to delete this issue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await axios.get(`${API_BASE_URL}/api/ticket/deleteissue/${issueId}`);
        Swal.fire({ icon: "success", title: "Deleted!", text: "Issue has been deleted.", timer: 2000, showConfirmButton: false });
        fetchIssues();
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || "Failed to delete issue." });
      }
    }
  };

  const getCategoryStyle = (category) => {
    switch ((category || "").toLowerCase()) {
      case "hardware": return { bg: "#fdecea", color: "#b71c1c", dot: "#dc3545" };
      case "software": return { bg: "#e6f0ff", color: "#0056b3", dot: "#007bff" };
      default:         return { bg: "#f0f0f0", color: "#555",    dot: "#6c757d" };
    }
  };

  const filteredIssues = React.useMemo(() => {
    return issues.filter((issue) => {
      const categoryMatch =
        filterStatus === "all" ||
        (issue.issue_category && issue.issue_category.toLowerCase() === filterStatus.toLowerCase());
      const search = searchTerm.toLowerCase();
      const searchMatch =
        search === "" || (issue.issue_name && issue.issue_name.toLowerCase().includes(search));
      return categoryMatch && searchMatch;
    });
  }, [issues, filterStatus, searchTerm]);

  const hardwareCount = filteredIssues.filter((i) => i.issue_category?.toLowerCase() === "hardware").length;
  const softwareCount = filteredIssues.filter((i) => i.issue_category?.toLowerCase() === "software").length;

  return (
    <>
      <style>{`
        .iss-wrapper { font-family: 'Segoe UI', system-ui, sans-serif; }

        .iss-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .iss-title { font-size: 1.2rem; font-weight: 700; color: #1a2e4a; margin: 0; }
        .iss-result-count { font-size: 0.82rem; color: #7a8fa6; margin-bottom: 14px; }

        /* Summary pills */
        .iss-summary-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .iss-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1.5px solid transparent;
          user-select: none;
        }

        .iss-pill-count { font-size: 1rem; font-weight: 700; margin-right: 2px; }

        /* Add issue form */
        .iss-add-form {
          background: #fff;
          border: 1px solid #e4ecf4;
          border-radius: 8px;
          padding: 16px 18px;
          margin-bottom: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-end;
        }

        .iss-form-field { display: flex; flex-direction: column; gap: 5px; }
        .iss-form-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #7a8fa6;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .iss-input, .iss-select {
          border: 1.5px solid #d0dbe8;
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 0.83rem;
          color: #2c3e50;
          background: #fff;
          outline: none;
          font-family: 'Segoe UI', system-ui, sans-serif;
          transition: border-color .15s, box-shadow .15s;
          height: 38px;
        }

        .iss-input { min-width: 220px; flex: 1; }
        .iss-select { min-width: 130px; appearance: auto; cursor: pointer; }

        .iss-input:focus, .iss-select:focus {
          border-color: #294a70;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
        }

        .iss-add-btn {
          height: 38px;
          padding: 0 20px;
          background: #1a2e4a;
          color: #fff;
          border: none;
          border-radius: 7px;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          transition: background .15s, transform .1s;
          white-space: nowrap;
        }

        .iss-add-btn:hover:not(:disabled) {
          background: #243f60;
          transform: translateY(-1px);
        }

        .iss-add-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .iss-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: issSpin .7s linear infinite;
        }

        @keyframes issSpin { to { transform: rotate(360deg); } }

        .iss-form-error {
          font-size: 0.78rem;
          color: #dc3545;
          width: 100%;
          margin-top: -4px;
        }

        /* Table */
        .iss-table-wrap { border-radius: 8px; overflow: hidden; border: 1px solid #e4ecf4; }

        .iss-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          background: #fff;
        }

        .iss-table thead tr { background: #f5f8fc; border-bottom: 1.5px solid #e4ecf4; }

        .iss-table thead th {
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: #7a8fa6;
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .iss-table tbody tr { border-bottom: 1px solid #f0f4f9; transition: background .12s; }
        .iss-table tbody tr:last-child { border-bottom: none; }
        .iss-table tbody tr:hover { background: #f8fbff; }
        .iss-table td { padding: 10px 14px; vertical-align: middle; color: #2c3e50; }

        .iss-name { font-weight: 500; color: #1a2e4a; }

        .iss-cat-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .iss-cat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .iss-icon-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1.5px solid #f5b8b3;
          color: #c0392b;
          background: transparent;
          cursor: pointer;
          transition: background .15s, transform .1s;
          font-size: 12px;
        }

        .iss-icon-btn:hover {
          background: #fdecea;
          transform: translateY(-1px);
        }

        /* Footer summary */
        .iss-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #f0f4f9;
          font-size: 0.78rem;
          color: #7a8fa6;
        }

        .iss-footer strong { color: #3d5166; }

        .iss-footer-right { display: flex; gap: 18px; }

        /* Empty state */
        .iss-empty { text-align: center; padding: 48px 0; color: #7a8fa6; }
        .iss-empty-icon { font-size: 2.2rem; margin-bottom: 10px; opacity: 0.4; }
      `}</style>

      {loading && issues.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#294a70" }} role="status">
            <span className="visually-hidden">Loading issues...</span>
          </div>
          <p className="mt-2" style={{ color: "#7a8fa6", fontSize: "0.9rem" }}>Loading issues...</p>
        </div>
      ) : (
        <div className="iss-wrapper">
          {/* Header */}
          <div className="iss-header-row">
            <h5 className="iss-title">Issue Management</h5>
          </div>
          <div className="iss-result-count">
            {filteredIssues.length} result{filteredIssues.length !== 1 ? "s" : ""} found
          </div>

          {/* Summary Pills */}
          <div className="iss-summary-pills">
            {[
              { label: "Hardware", count: hardwareCount, style: { bg: "#fdecea", color: "#b71c1c", border: "#f5c6c3" } },
              { label: "Software", count: softwareCount, style: { bg: "#e6f0ff", color: "#0056b3", border: "#b3d0ff" } },
            ].map(({ label, count, style }) => (
              <span
                key={label}
                className="iss-pill"
                style={{ background: style.bg, color: style.color, borderColor: style.border }}
              >
                <span className="iss-pill-count">{count}</span>
                {label}
              </span>
            ))}
          </div>

          {/* Add Issue Form */}
          <form className="iss-add-form" onSubmit={handleAddIssue}>
            <div className="iss-form-field" style={{ flex: 1, minWidth: 180 }}>
              <label className="iss-form-label">Issue Name</label>
              <input
                className="iss-input"
                type="text"
                placeholder="Enter issue name"
                value={newIssueName}
                onChange={(e) => setNewIssueName(e.target.value)}
              />
            </div>

            <div className="iss-form-field">
              <label className="iss-form-label">Category</label>
              <select
                className="iss-select"
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
              >
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
              </select>
            </div>

            <button type="submit" className="iss-add-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="iss-spinner" />
                  Adding…
                </>
              ) : (
                <>
                  <FaPlus size={11} />
                  Add Issue
                </>
              )}
            </button>

            {error && <div className="iss-form-error">{error}</div>}
          </form>

          {/* Table */}
          {filteredIssues.length > 0 ? (
            <div className="iss-table-wrap">
              <table className="iss-table">
                <thead>
                  <tr>
                    <th>Issue Name</th>
                    <th>Category</th>
                    <th style={{ width: 80, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue, index) => {
                    const catStyle = getCategoryStyle(issue.issue_category);
                    return (
                      <tr key={issue.issue_id || index}>
                        <td><span className="iss-name">{issue.issue_name}</span></td>
                        <td>
                          <span
                            className="iss-cat-badge"
                            style={{ background: catStyle.bg, color: catStyle.color }}
                          >
                            <span className="iss-cat-dot" style={{ background: catStyle.dot }} />
                            {issue.issue_category
                              ? issue.issue_category.charAt(0).toUpperCase() + issue.issue_category.slice(1)
                              : "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="iss-icon-btn"
                            onClick={() => handleDeleteIssue(issue.issue_id)}
                            title="Delete issue"
                          >
                            <FaTrash size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="iss-empty">
              <div className="iss-empty-icon">🔍</div>
              <h6 style={{ color: "#3d5166", fontWeight: 600 }}>No issues found</h6>
              <p style={{ fontSize: "0.83rem" }}>
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your filters or search term."
                  : "Add a new issue above to get started."}
              </p>
            </div>
          )}

          {/* Footer summary */}
          <div className="iss-footer">
            <span>Total Issues: <strong>{filteredIssues.length}</strong></span>
            <div className="iss-footer-right">
              <span>Hardware: <strong>{hardwareCount}</strong></span>
              <span>Software: <strong>{softwareCount}</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Issues;