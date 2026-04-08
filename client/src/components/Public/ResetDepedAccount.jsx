import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import Logo from "../../assets/SDO_Logo1.png";
import { FaArrowLeft } from "react-icons/fa";

// ─── Shared style constants (outside component to avoid recreation on render) ─
const INP_STYLE = {
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
const INP_READONLY = { ...INP_STYLE, background: "#f7f9fc", color: "#7a8fa6" };
const INP_SELECT   = { ...INP_STYLE, appearance: "auto", cursor: "pointer" };

// ─── Field defined OUTSIDE the parent component ───────────────────────────────
// Defining it inside causes React to treat it as a new component type on every
// render, unmounting + remounting inputs and stealing focus after each keystroke.
const Field = ({ label, required, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7a8fa6", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label} {required && <span style={{ color: "#dc3545" }}>*</span>}
    </label>
    {children}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ResetDepedAccount = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    selectedType: "",
    surname: "",
    firstName: "",
    middleName: "",
    school: "",
    schoolID: "",
    employeeNumber: "",
    personalEmail: "",
    deped_email: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/depedacc/schoolList`);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) throw new Error("Response is not JSON");
        const data = await response.json();
        setSchools(data);
        setError("");
      } catch (err) {
        setError("Error fetching schools. Please check your network and server.");
        setSchools([]);
      }
    };
    fetchSchools();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSchoolChange = (e) => {
    const selectedSchool = schools.find((s) => s.school === e.target.value);
    setFormData((prev) => ({
      ...prev,
      school:   selectedSchool ? selectedSchool.school     : "",
      schoolID: selectedSchool ? selectedSchool.schoolCode : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const { selectedType, surname, firstName, school, schoolID, employeeNumber, personalEmail, deped_email } = formData;

    if (!selectedType || !surname || !firstName || !school || !schoolID || !employeeNumber || !personalEmail || !deped_email) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }
    if (!deped_email.endsWith("@deped.gov.ph")) {
      setError("DepEd email must end with @deped.gov.ph");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/depedacc/reset-deped-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...formData, middleName: formData.middleName || "" }),
      });

      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          title: "Success!",
          html: `Reset Account request submitted!<br><br>Request Number: <b>${data.resetNumber}</b><br><br>Please screenshot to check your status`,
          icon: "success",
          confirmButtonText: "Done",
          willClose: () => navigate("/"),
        });
        setFormData({
          selectedType: "", surname: "", firstName: "", middleName: "",
          school: "", schoolID: "", employeeNumber: "", personalEmail: "", deped_email: "",
        });
      } else {
        const errorText = await response.text();
        setError(`Failed to submit: ${response.status} - ${errorText || response.statusText}`);
      }
    } catch (err) {
      setError(`Error submitting request: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showFields = !!formData.selectedType;

  return (
    <>
      <style>{`
        .rda-inp:focus, .rda-sel:focus {
          border-color: #294a70 !important;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
          outline: none;
        }
        .rda-inp, .rda-sel { outline: none; }
        .rda-submit:hover:not(:disabled) {
          background: #243f60 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }
        .rda-spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: rdaSpin .7s linear infinite; vertical-align: middle;
        }
        @keyframes rdaSpin { to { transform: rotate(360deg); } }
        .rda-back:hover { color: #1a2e4a !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f0f4f9", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ background: "#1a2e4a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <img src={Logo} alt="SDO" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>SDO Cabuyao</span>
          <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>Reset DepEd Account</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 16px 48px" }}>
          <div style={{ width: "100%", maxWidth: 680 }}>

            {/* Back + title */}
            <div style={{ marginBottom: 20 }}>
              <Link to="/" className="rda-back"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#995a5a", textDecoration: "none", marginBottom: 12, transition: "color .15s" }}>
                <FaArrowLeft size={11} /> Back to Login
              </Link>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1a2e4a", margin: "0 0 4px" }}>
                Reset Existing DepEd Account
              </h1>
              <p style={{ fontSize: "0.82rem", color: "#7a8fa6", margin: 0 }}>
                Fill in the details below to submit a reset request.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fdecea", border: "1px solid #f5c6c3", borderRadius: 7, color: "#b71c1c", padding: "10px 16px", fontSize: "0.83rem", marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Card */}
            <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#1a2e4a", padding: "13px 20px" }}>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>Request Details</span>
              </div>

              <form onSubmit={handleSubmit} noValidate style={{ padding: "24px 24px 28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>

                  {/* Account Type — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Account Type" required>
                      <select className="rda-sel" name="selectedType" value={formData.selectedType} onChange={handleChange} required style={INP_SELECT}>
                        <option value="">— Select Account Type —</option>
                        <option value="gmail">DepEd Gmail Account</option>
                        <option value="office365">Office 365 Account</option>
                      </select>
                    </Field>
                  </div>

                  {showFields && (
                    <>
                      <Field label="Surname" required>
                        <input className="rda-inp" type="text" name="surname" value={formData.surname} onChange={handleChange} placeholder="e.g. Dela Cruz" style={INP_STYLE} required />
                      </Field>

                      <Field label="First Name" required>
                        <input className="rda-inp" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="e.g. Juan" style={INP_STYLE} required />
                      </Field>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <Field label="Middle Name">
                          <input className="rda-inp" type="text" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="e.g. Santos (optional)" style={INP_STYLE} />
                        </Field>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <Field label="School" required>
                          <select className="rda-sel" name="school" value={formData.school} onChange={handleSchoolChange} required style={INP_SELECT}>
                            <option value="">— Select School —</option>
                            {schools.map((s) => (
                              <option key={s.schoolCode} value={s.school}>{s.school}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <Field label="School ID" required>
                        <input className="rda-inp" type="text" name="schoolID" value={formData.schoolID} placeholder="Auto-filled" readOnly required style={INP_READONLY} />
                      </Field>

                      <Field label="Employee Number" required>
                        <input className="rda-inp" type="text" name="employeeNumber" value={formData.employeeNumber} onChange={handleChange} placeholder="Your employee number" style={INP_STYLE} required />
                      </Field>

                      <Field label="Personal Email" required>
                        <input className="rda-inp" type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} placeholder="name@example.com" style={INP_STYLE} required />
                      </Field>

                      <Field label="DepEd Email" required>
                        <input className="rda-inp" type="email" name="deped_email" value={formData.deped_email} onChange={handleChange} placeholder="name@deped.gov.ph" style={INP_STYLE} required />
                        <span style={{ fontSize: "0.72rem", color: "#7a8fa6" }}>Must end with @deped.gov.ph</span>
                      </Field>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #f0f4f9", margin: "24px 0 20px" }} />

                <button
                  type="submit"
                  className="rda-submit"
                  disabled={isSubmitting || !formData.selectedType}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 42, background: "#1a2e4a", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                    cursor: isSubmitting || !formData.selectedType ? "not-allowed" : "pointer",
                    opacity: isSubmitting || !formData.selectedType ? 0.65 : 1,
                    transition: "background .2s, transform .15s, box-shadow .2s",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                  }}
                >
                  {isSubmitting ? <><span className="rda-spin" style={{ marginRight: 6 }} />Submitting…</> : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetDepedAccount;