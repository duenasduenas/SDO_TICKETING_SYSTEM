import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import Logo from "../../assets/SDO_Logo1.png";
import { FaArrowLeft, FaRegTrashAlt, FaDownload } from "react-icons/fa";

// ─── Shared style constant (replaces the inp() function) ─────────────────────
const INP_STYLE = {
  width: "100%", boxSizing: "border-box", height: 44,
  border: "1px solid #ced4da", borderRadius: "0.375rem",
  padding: "0.375rem 0.75rem", fontSize: "1rem", lineHeight: 1.5,
  color: "#212529", backgroundColor: "#fff",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};
const INP_READONLY = { ...INP_STYLE, background: "#f7f9fc", color: "#7a8fa6" };

// ─── Field & FileField defined OUTSIDE the parent component ──────────────────
// If they were inside, React would treat them as new component types on every
// render, unmount + remount the inputs, and steal focus after each keystroke.

const Field = ({ label, required, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7a8fa6", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label} {required && <span style={{ color: "#dc3545" }}>*</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: "0.72rem", color: "#7a8fa6" }}>{hint}</span>}
  </div>
);

const FileField = ({ label, name, required, preview, onFileChange, onRemove }) => (
  <Field label={label} required={required}>
    <div style={{ border: "1.5px dashed #d0dbe8", borderRadius: 7, padding: "10px 12px", background: "#f7f9fc" }}>
      <input
        type="file" name={name}
        onChange={onFileChange}
        accept=".jpg,.jpeg,.png,.pdf"
        required={required}
        style={{ fontSize: "0.8rem", width: "100%" }}
      />
    </div>
    {preview && (
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f5f8fc", border: "1px solid #e4ecf4", borderRadius: 6, padding: "8px 10px", marginTop: 4 }}>
        {preview.url && <img src={preview.url} alt={preview.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />}
        <span style={{ flex: 1, fontSize: "0.78rem", color: "#3d5166", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.name}</span>
        <button type="button" onClick={() => onRemove(name)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: 2 }}>
          <FaRegTrashAlt size={13} />
        </button>
      </div>
    )}
  </Field>
);

// ─── Main component ───────────────────────────────────────────────────────────
const RequestDepedAccount = () => {
  const navigate = useNavigate();
  const [schools,      setSchools]      = useState([]);
  const [designations, setDesignations] = useState([]);
  const [formData, setFormData] = useState({
    selectedType: "",
    surname: "", firstName: "", middleName: "",
    designation: "", school: "", schoolID: "",
    personalGmail: "", employeeNumber: "",
    personalEmail: "", deped_email: "",
    proofOfIdentity: null, prcID: null, endorsementLetter: null,
    isDepedRA: false, attachmentPreviews: [],
  });
  const [error,        setError]        = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJSON = async (url, setter, label) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) throw new Error("Not JSON");
        setter(await res.json());
      } catch (err) {
        setError(`Error fetching ${label}.`);
        setter([]);
      }
    };
    fetchJSON(`${API_BASE_URL}/api/depedacc/schoolList`,   setSchools,      "schools");
    fetchJSON(`${API_BASE_URL}/api/depedacc/designations`, setDesignations, "designations");
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name !== "isDepedRA") setError("");
  };

  const handleSchoolChange = (e) => {
    const found = schools.find(s => s.school === e.target.value);
    setFormData(prev => ({
      ...prev,
      school:   found ? found.school     : "",
      schoolID: found ? found.schoolCode : "",
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File size exceeds 5MB limit"); return; }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev, [name]: file,
          attachmentPreviews: [...prev.attachmentPreviews.filter(f => f.type !== name), { name: file.name, url: reader.result, type: name }],
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev, [name]: file,
        attachmentPreviews: [...prev.attachmentPreviews.filter(f => f.type !== name), { name: file.name, type: name }],
      }));
    }
  };

  const handleRemoveAttachment = (type) => {
    setFormData(prev => ({
      ...prev, [type]: null,
      attachmentPreviews: prev.attachmentPreviews.filter(f => f.type !== type),
    }));
  };

  const isValidGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const { selectedType, surname, firstName, school, schoolID,
      personalGmail, proofOfIdentity, prcID, endorsementLetter, isDepedRA } = formData;

    if (!isDepedRA) {
      setError("You must agree and give your consent before submitting.");
      setIsSubmitting(false);
      return;
    }
    if (!selectedType || !surname || !firstName || !school || !schoolID) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }
    if (personalGmail?.toLowerCase().endsWith("@deped.gov.ph")) {
      setError("Personal Gmail must not be a DepEd email address (@deped.gov.ph).");
      setIsSubmitting(false);
      return;
    }
    if (!isValidGmail(personalGmail)) {
      setError("Please provide a valid Gmail address (must end with @gmail.com)");
      setIsSubmitting(false);
      return;
    }

    try {
      const body = new FormData();
      body.append("selectedType",  selectedType);
      body.append("surname",       surname);
      body.append("firstName",     formData.firstName);
      body.append("middleName",    formData.middleName || "");
      body.append("designation",   formData.designation);
      body.append("school",        school);
      body.append("schoolID",      schoolID);
      body.append("personalGmail", personalGmail);
      if (proofOfIdentity)   body.append("proofOfIdentity",   proofOfIdentity);
      if (prcID)             body.append("prcID",             prcID);
      if (endorsementLetter) body.append("endorsementLetter", endorsementLetter);

      const response = await fetch(`${API_BASE_URL}/api/depedacc/request-deped-account`, { method: "POST", body });

      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          title: "Success!",
          html: `New Account request submitted!<br><br>Request Number: <b>${data.requestNumber}</b><br><br>Please screenshot to check your status`,
          icon: "success",
          confirmButtonText: "Done",
          willClose: () => navigate("/"),
        });
        setFormData({
          selectedType: "", surname: "", firstName: "", middleName: "",
          designation: "", school: "", schoolID: "", personalGmail: "",
          employeeNumber: "", personalEmail: "", deped_email: "",
          proofOfIdentity: null, prcID: null, endorsementLetter: null,
          isDepedRA: false, attachmentPreviews: [],
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

  const showFields  = !!formData.selectedType;
  const getPreview  = (type) => formData.attachmentPreviews.find(f => f.type === type);

  return (
    <>
      <style>{`
        .rda-inp:focus, .rda-sel:focus {
          border-color: #294a70;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
          outline: none;
        }
        .rda-inp, .rda-sel { outline: none; }
        .rda-submit:hover:not(:disabled) {
          background: #243f60 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }
        .rda-back:hover { color: #1a2e4a !important; }
        .rda-spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: rdaSpin .7s linear infinite; vertical-align: middle;
        }
        @keyframes rdaSpin { to { transform: rotate(360deg); } }
        .rda-dl-link { display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #4a7ab8; text-decoration: none; margin-bottom: 8px; }
        .rda-dl-link:hover { color: #1a2e4a; text-decoration: underline; }
        .rda-consent-box {
          background: #f5f8fc; border: 1px solid #e4ecf4;
          border-radius: 8px; padding: 16px;
          font-size: 0.8rem; color: #5a7a99; line-height: 1.6;
        }
        .rda-checkbox-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.83rem; font-weight: 600; color: #1a2e4a;
          cursor: pointer; margin-top: 10px;
        }
        .rda-checkbox-label input { width: 16px; height: 16px; cursor: pointer; accent-color: #294a70; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f0f4f9", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ background: "#1a2e4a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <img src={Logo} alt="SDO" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>SDO Cabuyao</span>
          <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>New DepEd Account Request</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 16px 48px" }}>
          <div style={{ width: "100%", maxWidth: 720 }}>

            {/* Back + title */}
            <div style={{ marginBottom: 20 }}>
              <Link to="/" className="rda-back"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#995a5a", textDecoration: "none", marginBottom: 12, transition: "color .15s" }}>
                <FaArrowLeft size={11} /> Back to Login
              </Link>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1a2e4a", margin: "0 0 4px" }}>
                Request New DepEd Account
              </h1>
              <p style={{ fontSize: "0.82rem", color: "#7a8fa6", margin: 0 }}>
                Fill in the details below to submit a new account request.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ background: "#fdecea", border: "1px solid #f5c6c3", borderRadius: 7, color: "#b71c1c", padding: "10px 16px", fontSize: "0.83rem", marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Account Information card */}
              <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ background: "#1a2e4a", padding: "13px 20px" }}>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>Account Information</span>
                </div>
                <div style={{ padding: "24px 24px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>

                    {/* Account Type */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Field label="Account Type" required>
                        <select className="rda-sel" name="selectedType" value={formData.selectedType} onChange={handleChange} required
                          style={{ ...INP_STYLE, appearance: "auto", cursor: "pointer" }}>
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
                            <select className="rda-sel" name="school" value={formData.school} onChange={handleSchoolChange} required
                              style={{ ...INP_STYLE, appearance: "auto", cursor: "pointer" }}>
                              <option value="">— Select School —</option>
                              {schools.map(s => <option key={s.schoolCode} value={s.school}>{s.school}</option>)}
                            </select>
                          </Field>
                        </div>

                        <Field label="School ID" required>
                          <input className="rda-inp" type="text" name="schoolID" value={formData.schoolID} placeholder="Auto-filled" readOnly required style={INP_READONLY} />
                        </Field>

                        <Field label="Designation" required>
                          <select className="rda-sel" name="designation" value={formData.designation} onChange={handleChange} required
                            style={{ ...INP_STYLE, appearance: "auto", cursor: "pointer" }}>
                            <option value="">— Select Designation —</option>
                            {designations.map(d => <option key={d.id} value={d.designation}>{d.designation}</option>)}
                          </select>
                        </Field>

                        <div style={{ gridColumn: "1 / -1" }}>
                          <Field label="Personal Gmail" required hint="Must be a @gmail.com address — not your DepEd email">
                            <input className="rda-inp" type="email" name="personalGmail" value={formData.personalGmail} onChange={handleChange} placeholder="name@gmail.com" style={INP_STYLE} required />
                          </Field>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments card */}
              {showFields && (
                <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ background: "#1a2e4a", padding: "13px 20px" }}>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>Required Attachments</span>
                  </div>
                  <div style={{ padding: "24px 24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>

                    <FileField
                      label="PRC ID" name="prcID" required
                      preview={getPreview("prcID")}
                      onFileChange={handleFileChange}
                      onRemove={handleRemoveAttachment}
                    />

                    <div style={{ gridColumn: "1 / -1" }}>
                      <Field label="Endorsement Letter" required>
                        <a href="https://docs.google.com/document/d/16FdN46utYzlT24PNWgKP82KUc2lWg3tu/export?format=docx"
                          className="rda-dl-link" download="Endorsement_Letter_Template.docx">
                          <FaDownload size={11} /> Download Endorsement Letter Template
                        </a>
                        <div style={{ border: "1.5px dashed #d0dbe8", borderRadius: 7, padding: "10px 12px", background: "#f7f9fc" }}>
                          <input type="file" name="endorsementLetter" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" required style={{ fontSize: "0.8rem", width: "100%" }} />
                        </div>
                        {getPreview("endorsementLetter") && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f5f8fc", border: "1px solid #e4ecf4", borderRadius: 6, padding: "8px 10px", marginTop: 4 }}>
                            {getPreview("endorsementLetter").url && <img src={getPreview("endorsementLetter").url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />}
                            <span style={{ flex: 1, fontSize: "0.78rem", color: "#3d5166", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getPreview("endorsementLetter").name}</span>
                            <button type="button" onClick={() => handleRemoveAttachment("endorsementLetter")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: 2 }}>
                              <FaRegTrashAlt size={13} />
                            </button>
                          </div>
                        )}
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* Consent card */}
              {showFields && (
                <div style={{ background: "#fff", border: "1px solid #e4ecf4", borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
                  <div className="rda-consent-box">
                    I hereby authorize the Department of Education (DepEd) to collect, process, store, and use my personal information provided in this form for official purposes, including the creation and management of my DepEd account, in accordance with Republic Act No. 10173 (Data Privacy Act of 2012).
                    <br /><br />
                    I certify that the information I have provided is true, correct, and complete. I understand that my data will be handled with confidentiality and used only by authorized personnel.
                  </div>
                  <label className="rda-checkbox-label">
                    <input type="checkbox" name="isDepedRA" checked={formData.isDepedRA} onChange={handleChange} />
                    I agree / I give my consent
                  </label>
                </div>
              )}

              {/* Submit */}
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
                {isSubmitting
                  ? <><span className="rda-spin" style={{ marginRight: 6 }} />Submitting…</>
                  : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestDepedAccount;