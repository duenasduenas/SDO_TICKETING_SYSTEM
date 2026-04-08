import axios from "axios";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Nav from "./Header";
import { useWindowSize } from "react-use";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { API_BASE_URL } from "../../config";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { width } = useWindowSize();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded Token:", decoded); // Debugging
      } catch (error) {
        console.error("Error decoding token", error);
        setError("Authentication error. Please log in again.");
      }
    } else {
      setError("No authentication token found. Please log in.");
    }
  }, []);
  
  // Frontend handleSubmit function with SweetAlert confirmation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    // Show confirmation SweetAlert
    Swal.fire({
      title: 'Confirm Password Change',
      text: "Are you sure you want to change your password?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#294a70',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, change it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary me-2',
        cancelButton: 'btn btn-secondary'
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${API_BASE_URL}/api/reset/change-password`,
            { currentPassword, newPassword, confirmPassword },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Show success SweetAlert
          Swal.fire({
            title: 'Password Changed!',
            text: 'Your password has been successfully updated',
            icon: 'success',
            confirmButtonColor: '#294a70',
            confirmButtonText: 'Great!',
            customClass: {
              confirmButton: 'btn btn-primary'
            },
            buttonsStyling: false
          });
          
          setSuccess(response.data.message);
          // Clear form after successful password change
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } catch (err) {
          setError(err.response?.data?.message || "An error occurred.");
        }
      }
    });
  };

  return (
    <>
      <Nav />
      {/* Main content container with responsive spacing */}
      <div 
        className="main-content"
        style={{ 
          paddingTop: "80px", // Adjust based on navbar height
          marginLeft: width >= 768 ? "250px" : "0",
          transition: "margin-left 0.3s ease-in-out",
          minHeight: "100vh",
          padding: "20px",
          backgroundColor: "#f8f9fa"
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header py-2" style={{ backgroundColor: "#294a70", color: "white" }}>
                  <h3 className="card-title mb-0 text-center">Change Your Password</h3>
                </div>
                <div className="card-body p-4">
                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError("")}></button>
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {success}
                      <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="needs-validation">
                    <div className="mb-4">
                      <label htmlFor="currentPassword" className="form-label fw-bold">Current Password</label>
                      <div className="input-group">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          className="form-control"
                          id="currentPassword"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          required
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="newPassword" className="form-label fw-bold">New Password</label>
                      <div className="input-group">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="form-control"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                          required
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                      <div className="form-text">Password must be at least 8 characters long.</div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="confirmPassword" className="form-label fw-bold">Confirm New Password</label>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          required
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2 mt-4">
                      <button 
                        type="submit" 
                        className="btn btn-primary py-2"
                        style={{ backgroundColor: "#294a70", border: "none" }}
                      >
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;