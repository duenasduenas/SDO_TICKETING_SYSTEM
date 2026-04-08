import React, { useState } from "react";
import axios from "axios";
import Nav from "./Header";
import { API_BASE_URL } from "../../config";
import Logo from "../../assets/SDO_Logo1.png";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaKey } from "react-icons/fa";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    name: "",
    school: "",
    schoolId: "",
    employeeNumber: "",
  });
  const [message,     setMessage]     = useState("");
  const [isError,     setIsError]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/reset/idas-reset`, formData);
      setMessage(response.data.message);
      setIsError(false);
      setFormData({ name: "", school: "", schoolId: "", employeeNumber: "" });
    } catch (error) {
      setMessage("Error submitting the request. Please try again.");
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    height: 38,
    border: "1.5px solid #d0dbe8",
    borderRadius: 7,
    padding: "0 12px",
    fontSize: "0.83rem",
    color: "#2c3e50",
    background: "#fff",
    outline: "none",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: "border-color .15s, box-shadow .15s",
  };

  const Field = ({ label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontSize: "0.72rem", fontWeight: 600, color: "#7a8fa6",
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label} <span style={{ color: "#dc3545" }}>*</span>
      </label>
      {children}
    </div>
  );

  return (
    <>
      <style>{`
        .rp-inp:focus {
          border-color: #294a70 !important;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
        }
        .rp-btn:hover:not(:disabled) {
          background: #243f60 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }
        .rp-back:hover { color: #1a2e4a !important; }
        .rp-spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: rpSpin .7s linear infinite;
          vertical-align: middle; margin-right: 6px;
        }
        @keyframes rpSpin { to { transform: rotate(360deg); } }
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
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>IDAS Reset Password</span>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
          <div style={{ width: "100%", maxWidth: 480 }}>

            {/* Back link */}
            <Link
              to="/"
              className="rp-back"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#995a5a", textDecoration: "none", marginBottom: 20, transition: "color .15s" }}
            >
              <FaArrowLeft size={11} /> Back to Login
            </Link>

            {/* Card */}
            <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(26,46,74,0.07)" }}>

              {/* Card header */}
              <div style={{ background: "#1a2e4a", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FaKey size={13} style={{ color: "rgba(255,255,255,0.65)" }} />
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.92rem" }}>IDAS Reset Password</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", margin: "4px 0 0" }}>
                  Fill in your details to submit a password reset request.
                </p>
              </div>

              {/* Form body */}
              <div style={{ padding: "28px 24px 32px" }}>

                {/* Feedback message */}
                {message && (
                  <div style={{
                    background: isError ? "#fdecea" : "#e6f9ed",
                    border: `1px solid ${isError ? "#f5c6c3" : "#b7eacc"}`,
                    borderRadius: 7,
                    color: isError ? "#b71c1c" : "#1a7c3e",
                    padding: "10px 16px",
                    fontSize: "0.83rem",
                    marginBottom: 20,
                  }}>
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  <Field label="Name">
                    <input
                      className="rp-inp"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                      style={inp}
                    />
                  </Field>

                  <Field label="School">
                    <input
                      className="rp-inp"
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      placeholder="Your school name"
                      required
                      style={inp}
                    />
                  </Field>

                  <Field label="School ID">
                    <input
                      className="rp-inp"
                      type="text"
                      name="schoolId"
                      value={formData.schoolId}
                      onChange={handleChange}
                      placeholder="Your school ID"
                      required
                      style={inp}
                    />
                  </Field>

                  <Field label="Employee Number">
                    <input
                      className="rp-inp"
                      type="text"
                      name="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={handleChange}
                      placeholder="Your employee number"
                      required
                      style={inp}
                    />
                  </Field>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid #f0f4f9", margin: "4px 0" }} />

                  <button
                    type="submit"
                    className="rp-btn"
                    disabled={isSubmitting}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      width: "100%", height: 42,
                      background: "#1a2e4a", color: "#fff",
                      border: "none", borderRadius: 8,
                      fontSize: "0.88rem", fontWeight: 600,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                      transition: "background .2s, transform .15s, box-shadow .2s",
                      fontFamily: "'Segoe UI', system-ui, sans-serif",
                    }}
                  >
                    {isSubmitting
                      ? <><span className="rp-spin" />Submitting…</>
                      : "Submit Request"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;