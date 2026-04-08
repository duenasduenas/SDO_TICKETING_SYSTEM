import axios from "axios";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faEyeSlash, faSchool, faUndo,
  faLock, faKey, faCheckCircle, faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { API_BASE_URL } from "../../config";

const AdminChangePassword = () => {
  const [currentPassword,      setCurrentPassword]      = useState("");
  const [newPassword,          setNewPassword]          = useState("");
  const [confirmPassword,      setConfirmPassword]      = useState("");
  const [error,                setError]                = useState("");
  const [success,              setSuccess]              = useState("");
  const [showCurrentPassword,  setShowCurrentPassword]  = useState(false);
  const [showNewPassword,      setShowNewPassword]      = useState(false);
  const [showConfirmPassword,  setShowConfirmPassword]  = useState(false);
  const [schools,              setSchools]              = useState([]);
  const [selectedSchool,       setSelectedSchool]       = useState("");
  const [resetError,           setResetError]           = useState("");
  const [resetSuccess,         setResetSuccess]         = useState("");
  const [passwordStrength,     setPasswordStrength]     = useState(0);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/reset/schools`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchools(Array.isArray(res.data) ? res.data : []);
      } catch {
        setResetError("Failed to load school list.");
        setSchools([]);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try { jwtDecode(token); }
      catch { setError("Authentication error. Please log in again."); }
    } else {
      setError("No authentication token found. Please log in.");
    }
  }, []);

  useEffect(() => {
    if (!newPassword) { setPasswordStrength(0); return; }
    let s = 0;
    if (newPassword.length >= 8)          s++;
    if (/[A-Z]/.test(newPassword))        s++;
    if (/[a-z]/.test(newPassword))        s++;
    if (/[0-9]/.test(newPassword))        s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    setPasswordStrength(s);
  }, [newPassword]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][passwordStrength] || "";
  const strengthColor = ["#dee2e6", "#dc3545", "#ffc107", "#fd7e14", "#20c997", "#198754"][passwordStrength] || "#dee2e6";

  const handleSchoolReset = () => {
    if (!selectedSchool) { setResetError("Please select a school."); return; }
    const schoolName = schools.find(s => s.userId === Number(selectedSchool))?.school;
    Swal.fire({
      title: "Confirm Password Reset",
      html: `Reset password for <strong>${schoolName}</strong>?<br><br>New password will be: <code>password123</code>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Reset It",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_BASE_URL}/api/reset/reset-school-password`,
          { school: schoolName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({ title: "Done!", text: "School password reset to password123.", icon: "success", confirmButtonColor: "#294a70", timer: 2000, showConfirmButton: false });
        setResetSuccess("Password reset successfully.");
        setSelectedSchool("");
        setResetError("");
      } catch (err) {
        setResetError(err.response?.data?.message || "Reset failed. Please try again.");
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }

    Swal.fire({
      title: "Confirm Password Change",
      text: "Are you sure you want to change your password?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#294a70",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Change It",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${API_BASE_URL}/api/reset/change-password`,
          { currentPassword, newPassword, confirmPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({ title: "Password Changed!", text: "Your password has been updated.", icon: "success", confirmButtonColor: "#294a70", timer: 2000, showConfirmButton: false });
        setSuccess(res.data.message);
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } catch (err) {
        setError(err.response?.data?.message || "An error occurred.");
      }
    });
  };

  /* ── shared styles ── */
  const inp = (extra = {}) => ({
    flex: 1, height: 38, border: "1.5px solid #d0dbe8", borderRadius: "7px 0 0 7px",
    padding: "0 12px", fontSize: "0.83rem", color: "#2c3e50", background: "#fff",
    outline: "none", fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: "border-color .15s, box-shadow .15s", ...extra,
  });

  const eyeBtn = {
    height: 38, width: 38, display: "flex", alignItems: "center", justifyContent: "center",
    border: "1.5px solid #d0dbe8", borderLeft: "none", borderRadius: "0 7px 7px 0",
    background: "#f7f9fc", color: "#7a8fa6", cursor: "pointer",
    transition: "color .15s, background .15s",
  };

  const Alert = ({ msg, color, bgColor, borderColor, onClose }) => (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 7, color, padding: "10px 14px", fontSize: "0.83rem", marginBottom: 18 }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color, fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
    </div>
  );

  const PasswordInput = ({ id, value, onChange, show, onToggle, placeholder, minLength }) => (
    <div style={{ display: "flex" }}>
      <input
        className="acp-inp"
        id={id} type={show ? "text" : "password"}
        value={value} onChange={onChange}
        placeholder={placeholder}
        required minLength={minLength}
        style={inp()}
      />
      <button type="button" onClick={onToggle} style={eyeBtn}>
        <FontAwesomeIcon icon={show ? faEyeSlash : faEye} size="sm" />
      </button>
    </div>
  );

  const Field = ({ label, icon, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7a8fa6", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
        <FontAwesomeIcon icon={icon} size="sm" />
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <>
      <style>{`
        .acp-inp:focus {
          border-color: #294a70 !important;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
          outline: none;
        }
        .acp-btn-primary:hover:not(:disabled) {
          background: #243f60 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }
        .acp-btn-danger:hover:not(:disabled) {
          background: #b71c1c !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220,53,69,0.2);
        }
        .acp-spin {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: acpSpin .7s linear infinite; vertical-align: middle; margin-right: 6px;
        }
        @keyframes acpSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 560, margin: "0 auto" }}>

        {/* ── Page header ── */}
        <h5 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1a2e4a", margin: "0 0 4px" }}>
          Password Management
        </h5>
        <p style={{ fontSize: "0.82rem", color: "#7a8fa6", margin: "0 0 20px" }}>
          Update your admin password or reset a school's password.
        </p>

        {/* ══ Change Password Card ══ */}
        <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ background: "#1a2e4a", padding: "13px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <FontAwesomeIcon icon={faKey} style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }} />
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>Change Your Password</span>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ padding: "22px 24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>

            {error   && <Alert msg={error}   color="#b71c1c" bgColor="#fdecea" borderColor="#f5c6c3" onClose={() => setError("")} />}
            {success && <Alert msg={success} color="#1a7c3e" bgColor="#e6f9ed" borderColor="#b7eacc" onClose={() => setSuccess("")} />}

            <Field label="Current Password" icon={faLock}>
              <PasswordInput
                id="currentPassword" value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                show={showCurrentPassword} onToggle={() => setShowCurrentPassword(p => !p)}
                placeholder="Enter current password"
              />
            </Field>

            <Field label="New Password" icon={faKey}>
              <PasswordInput
                id="newPassword" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                show={showNewPassword} onToggle={() => setShowNewPassword(p => !p)}
                placeholder="Enter new password" minLength={8}
              />
              {/* Strength bar */}
              {newPassword && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.72rem", color: "#7a8fa6" }}>Password strength</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
                  </div>
                  <div style={{ height: 5, background: "#f0f4f9", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(passwordStrength / 5) * 100}%`, background: strengthColor, borderRadius: 10, transition: "width .3s, background .3s" }} />
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#7a8fa6", margin: "5px 0 0", lineHeight: 1.5 }}>
                    Use at least 8 characters with uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>
              )}
            </Field>

            <Field label="Confirm New Password" icon={faCheckCircle}>
              <PasswordInput
                id="confirmPassword" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                show={showConfirmPassword} onToggle={() => setShowConfirmPassword(p => !p)}
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <span style={{ fontSize: "0.75rem", color: "#dc3545" }}>Passwords do not match</span>
              )}
            </Field>

            <div style={{ borderTop: "1px solid #f0f4f9", paddingTop: 18 }}>
              <button
                type="submit"
                className="acp-btn-primary"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", height: 42, background: "#1a2e4a", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                  cursor: "pointer", transition: "background .2s, transform .15s, box-shadow .2s",
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              >
                <FontAwesomeIcon icon={faKey} size="sm" />
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* ══ Reset School Password Card ══ */}
        <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: "#b71c1c", padding: "13px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <FontAwesomeIcon icon={faSchool} style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }} />
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>Reset School Password</span>
          </div>

          <div style={{ padding: "22px 24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>

            {resetError   && <Alert msg={resetError}   color="#b71c1c" bgColor="#fdecea" borderColor="#f5c6c3" onClose={() => setResetError("")} />}
            {resetSuccess && <Alert msg={resetSuccess} color="#1a7c3e" bgColor="#e6f9ed" borderColor="#b7eacc" onClose={() => setResetSuccess("")} />}

            <Field label="Select School" icon={faSchool}>
              <select
                className="acp-inp"
                value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}
                style={{ height: 38, border: "1.5px solid #d0dbe8", borderRadius: 7, padding: "0 12px", fontSize: "0.83rem", color: "#2c3e50", background: "#fff", outline: "none", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "border-color .15s, box-shadow .15s", appearance: "auto", cursor: "pointer", width: "100%" }}
              >
                <option value="">— Choose a school —</option>
                {schools.map(s => (
                  <option key={s.userId} value={s.userId}>{s.school} ({s.username})</option>
                ))}
              </select>
            </Field>

            {/* Info note */}
            <div style={{ background: "#fff8e6", border: "1px solid #ffe8a3", borderRadius: 7, padding: "10px 14px", fontSize: "0.78rem", color: "#8a6000", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>This will reset the selected school's password to <strong>password123</strong>. The school will need to change it after logging in.</span>
            </div>

            <div style={{ borderTop: "1px solid #f0f4f9", paddingTop: 18 }}>
              <button
                type="button"
                className="acp-btn-danger"
                onClick={handleSchoolReset}
                disabled={!selectedSchool}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", height: 42,
                  background: selectedSchool ? "#dc3545" : "#f0f4f9",
                  color: selectedSchool ? "#fff" : "#aab8c8",
                  border: "none", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                  cursor: selectedSchool ? "pointer" : "not-allowed",
                  transition: "background .2s, transform .15s, box-shadow .2s",
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              >
                <FontAwesomeIcon icon={faUndo} size="sm" />
                Reset Password to Default
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminChangePassword;