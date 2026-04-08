import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import {
  UserPlus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  Inbox,
  CheckCircle,
  XCircle,
} from "lucide-react";

const CreateDesignation = () => {
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchDesignations = async () => {
    try {
      setListLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/designations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDesignations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching designations:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const handleSubmit = async () => {
    if (!designation.trim()) {
      setStatus("error");
      setMessage("Designation is required.");
      return;
    }
    setStatus(null);
    setMessage("");
    setLoading(true);
    try {
      if (!token) {
        setStatus("error");
        setMessage("No authentication token found. Please log in again.");
        return;
      }
      await axios.post(
        `${API_BASE_URL}/api/admin/create-designation`,
        { designation: designation.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus("success");
      setMessage("Designation created successfully!");
      setDesignation("");
      fetchDesignations();
      Swal.fire({ icon: "success", title: "Success!", text: "Designation created successfully!", timer: 2000, showConfirmButton: false });
    } catch (err) {
      if (err.response?.status === 401) {
        setStatus("error");
        setMessage("Session expired. Please log in again.");
      } else if (err.response?.data?.error) {
        setStatus("error");
        setMessage(err.response.data.error);
      } else {
        setStatus("error");
        setMessage("Failed to create designation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (d) => {
    setEditingId(d.id);
    setEditingValue(d.designation);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleEditSave = async (id) => {
    if (!editingValue.trim()) return;
    setEditLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/designation/${id}`,
        { designation: editingValue.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDesignations();
      setEditingId(null);
      setEditingValue("");
      Swal.fire({ icon: "success", title: "Updated!", text: "Designation updated successfully!", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || "Failed to update designation." });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Designation?",
      text: `Are you sure you want to delete "${name}"?`,
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/designation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDesignations();
      Swal.fire({ icon: "success", title: "Deleted!", text: "Designation deleted successfully.", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || "Failed to delete designation." });
    }
  };

  const filteredDesignations = designations.filter((d) =>
    d.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInputClasses = () => {
    const base = "form-control w-100 p-3 border rounded-lg shadow-sm";
    if (status === "error") return `${base} border-danger bg-danger-subtle`;
    if (status === "success") return `${base} border-success bg-success-subtle`;
    return `${base} border-secondary`;
  };

  return (
    <div className="container py-4">
      <div className="row g-4">

        {/* Left — Create Form */}
        <div className="col-12 col-md-5">
          <div className="card border-0 shadow-lg rounded-4 p-4 h-100">
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
              <div
                className="bg-primary bg-opacity-10 p-3 rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                style={{ width: "52px", height: "52px" }}
              >
                <UserPlus size={22} color="#0d6efd" />
              </div>
              <div>
                <h3 className="h5 mb-1 fw-bold text-dark">New Designation</h3>
                <p className="mb-0 text-muted small">Add a new role to the system</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-dark mb-2 small">
                Designation Name
              </label>
              <input
                type="text"
                className={getInputClasses()}
                placeholder="e.g. Principal, Teacher, Clerk"
                value={designation}
                onChange={(e) => { setDesignation(e.target.value); if (status) setStatus(null); }}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                disabled={loading}
              />
            </div>

            {status && message && (
              <div className={`alert ${status === "success" ? "alert-success" : "alert-danger"} d-flex align-items-center mb-4 p-3 rounded-lg border-0 shadow-sm`}>
                {status === "success"
                  ? <CheckCircle size={18} className="me-2 flex-shrink-0" />
                  : <XCircle size={18} className="me-2 flex-shrink-0" />
                }
                <div>{message}</div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary w-100 py-3 rounded-lg fw-semibold"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...</>
              ) : "Create Designation"}
            </button>
          </div>
        </div>

        {/* Right — Designation List */}
        <div className="col-12 col-md-7">
          <div className="card border-0 shadow-lg rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
              <div>
                <h3 className="h5 mb-1 fw-bold text-dark">Existing Designations</h3>
                <p className="mb-0 text-muted small">
                  {designations.length} designation{designations.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1"
                onClick={fetchDesignations}
                disabled={listLoading}
                title="Refresh"
              >
                <RefreshCw size={14} className={listLoading ? "spin" : ""} />
              </button>
            </div>

            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={15} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search designations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ maxHeight: "420px", overflowY: "auto" }}>
              {listLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="text-muted mt-2 small">Loading designations...</p>
                </div>
              ) : filteredDesignations.length === 0 ? (
                <div className="text-center py-5">
                  <Inbox size={40} className="text-muted mb-2" />
                  <p className="text-muted small">
                    {searchTerm ? "No designations match your search." : "No designations yet."}
                  </p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {filteredDesignations.map((d, index) => (
                    <li key={d.id || index} className="list-group-item px-2 py-3 border-bottom">
                      {editingId === d.id ? (
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(d.id);
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            autoFocus
                          />
                          <button
                            className="btn btn-success btn-sm px-3 d-flex align-items-center"
                            onClick={() => handleEditSave(d.id)}
                            disabled={editLoading}
                          >
                            {editLoading
                              ? <span className="spinner-border spinner-border-sm"></span>
                              : <Check size={15} />
                            }
                          </button>
                          <button
                            className="btn btn-secondary btn-sm px-3 d-flex align-items-center"
                            onClick={handleEditCancel}
                            disabled={editLoading}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center">
                          <div
                            className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                            style={{ width: "36px", height: "36px" }}
                          >
                            <span className="text-primary fw-bold small">
                              {d.designation.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="fw-medium text-dark flex-grow-1">{d.designation}</span>
                          <div className="d-flex gap-2 ms-2">
                            <button
                              className="btn btn-outline-primary btn-sm rounded-3 d-flex align-items-center gap-1"
                              onClick={() => handleEdit(d)}
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm rounded-3 d-flex align-items-center gap-1"
                              onClick={() => handleDelete(d.id, d.designation)}
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .list-group-item:hover { background-color: #f8f9ff; }
        .card { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default CreateDesignation;