import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Logo from "../../assets/SDO_Logo1.png";
import { LuUser } from "react-icons/lu";
import { GoLock } from "react-icons/go";
import { IoEyeOutline } from "react-icons/io5";
import { FaRegEyeSlash, FaTimes } from "react-icons/fa";
import { useAuth } from "../Context/AuthContext";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [retryAfter, setRetryAfter] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    let timer;
    if (retryAfter !== null) {
      setCountdown(retryAfter);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) return prev - 1;
          clearInterval(timer);
          setRetryAfter(null);
          setRemainingAttempts(3);
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [retryAfter]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const username = formRef.current.username.value;
    const password = formRef.current.password.value;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/userlogin`, { username, password });
      const data = response.data;

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Login Successful!",
          text: "Welcome Back!",
          timer: 500,
          showConfirmButton: false,
        }).then(() => {
          localStorage.setItem("token", data.token);
          const decodedUser = jwtDecode(data.token);
          localStorage.setItem("user", JSON.stringify(decodedUser));
          login(data.token);
          if (decodedUser.role === "Admin") {
            navigate("/admindashboard");
          } else {
            navigate("/schooldashboard");
          }
        });
      } else {
        setErrorMessage(data.message || "Login failed");
        if (data.retryAfter) setRetryAfter(data.retryAfter);
        if (data.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
        setShowModal(true);
      }
    } catch (error) {
      if (error.response) {
        const data = error.response.data;
        setErrorMessage(data.message || `Error: ${error.response.status}`);
        if (data.retryAfter) setRetryAfter(data.retryAfter);
        if (data.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
      } else if (error.request) {
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin(e);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #f0f4f9;
        }

        /* Left decorative panel */
        .login-panel {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 56px;
          background: #1a2e4a;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .login-panel { display: flex; width: 42%; }
          .login-right  { width: 58%; }
        }

        /* Geometric decorative circles */
        .login-panel::before {
          content: '';
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          border: 60px solid rgba(255,255,255,0.04);
          bottom: -100px;
          right: -80px;
        }

        .login-panel::after {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 40px solid rgba(255,255,255,0.06);
          top: 60px;
          right: 40px;
        }

        .panel-logo {
          width: 72px;
          height: 72px;
          object-fit: contain;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }

        .panel-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2.2rem;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .panel-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.6;
          max-width: 300px;
          position: relative;
          z-index: 1;
        }

        .panel-divider {
          width: 40px;
          height: 3px;
          background: #4a9eff;
          border-radius: 2px;
          margin: 24px 0;
          position: relative;
          z-index: 1;
        }

        .panel-links {
          margin-top: auto;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .panel-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color .2s;
        }

        .panel-link:hover { color: #fff; }

        .panel-link-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #4a9eff;
          flex-shrink: 0;
        }

        /* Right form area */
        .login-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 32px;
          background: #f0f4f9;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(26,46,74,0.09);
          padding: 40px 36px;
          animation: loginFadeUp .4s ease both;
        }

        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile logo (shown when panel is hidden) */
        .mobile-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        @media (min-width: 900px) {
          .mobile-logo-wrap { display: none; }
        }

        .mobile-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .mobile-logo-text {
          font-size: 0.88rem;
          font-weight: 600;
          color: #1a2e4a;
        }

        .login-card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #1a2e4a;
          margin-bottom: 6px;
        }

        .login-card-sub {
          font-size: 0.82rem;
          color: #7a8fa6;
          margin-bottom: 32px;
        }

        /* Input groups */
        .lg-field {
          margin-bottom: 18px;
        }

        .lg-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #3d5166;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .lg-input-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid #d0dbe8;
          border-radius: 8px;
          background: #fff;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }

        .lg-input-wrap:focus-within {
          border-color: #294a70;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.1);
        }

        .lg-input-icon {
          padding: 0 14px;
          color: #7a8fa6;
          display: flex;
          align-items: center;
          background: #f7f9fc;
          height: 44px;
          border-right: 1.5px solid #e4ecf4;
          flex-shrink: 0;
        }

        .lg-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 14px;
          font-size: 0.88rem;
          color: #2c3e50;
          height: 44px;
          background: transparent;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .lg-input::placeholder { color: #aab8c8; }

        .lg-eye-btn {
          background: none;
          border: none;
          padding: 0 14px;
          color: #7a8fa6;
          cursor: pointer;
          display: flex;
          align-items: center;
          height: 44px;
          transition: color .15s;
        }

        .lg-eye-btn:hover { color: #294a70; }

        /* Submit button */
        .lg-submit-btn {
          width: 100%;
          height: 46px;
          background: #1a2e4a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'DM Sans', system-ui, sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: background .2s, transform .15s, box-shadow .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.02em;
        }

        .lg-submit-btn:hover:not(:disabled) {
          background: #243f60;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }

        .lg-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Spinner */
        .lg-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Quick links */
        .lg-links {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid #f0f4f9;
          padding-top: 20px;
        }

        .lg-link {
          font-size: 0.8rem;
          color: #4a7ab8;
          text-decoration: none;
          transition: color .15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .lg-link:hover { color: #1a2e4a; }

        .lg-link-arrow { font-size: 10px; opacity: 0.6; }

        /* Error Modal overlay */
        .lg-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,46,74,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          animation: fadeIn .2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .lg-modal {
          background: #fff;
          border-radius: 12px;
          padding: 28px 28px 24px;
          width: 100%;
          max-width: 360px;
          box-shadow: 0 8px 32px rgba(26,46,74,0.18);
          animation: modalSlide .25s ease;
        }

        @keyframes modalSlide {
          from { transform: translateY(-12px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .lg-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .lg-modal-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1a2e4a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lg-modal-title-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fdecea;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #dc3545;
        }

        .lg-modal-close {
          background: none;
          border: none;
          color: #aab8c8;
          cursor: pointer;
          padding: 2px;
          transition: color .15s;
          line-height: 1;
        }

        .lg-modal-close:hover { color: #dc3545; }

        .lg-modal-body {
          font-size: 0.85rem;
          color: #3d5166;
          line-height: 1.6;
          margin-bottom: 18px;
        }

        .lg-modal-attempts {
          display: inline-block;
          background: #fff8e6;
          color: #8a6000;
          border: 1px solid #ffe8a3;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 6px;
        }

        .lg-modal-countdown {
          display: inline-block;
          background: #fdecea;
          color: #b71c1c;
          border: 1px solid #f5c6c3;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 6px;
        }

        .lg-modal-btn {
          width: 100%;
          height: 38px;
          background: #1a2e4a;
          color: #fff;
          border: none;
          border-radius: 7px;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: background .15s;
        }

        .lg-modal-btn:hover { background: #243f60; }
      `}</style>

      <div className="login-page">
        {/* Left decorative panel */}
        <div className="login-panel">
          <img src={Logo} alt="SDO Logo" className="panel-logo" />
          <div className="panel-title">SDO Cabuyao<br />Portal</div>
          <div className="panel-divider" />
          <p className="panel-sub">
            Schools Division Office of Cabuyao City — DepEd account management and support ticketing system.
          </p>
          <div className="panel-links">
            <Link to="/request-deped-account" className="panel-link">
              <span className="panel-link-dot" />
              Request New DepEd Account
            </Link>
            <Link to="/reset-deped-account" className="panel-link">
              <span className="panel-link-dot" />
              Reset Existing DepEd Account
            </Link>
            <Link to="/checktransaction" className="panel-link">
              <span className="panel-link-dot" />
              Check Transaction Status
            </Link>
          </div>
        </div>

        {/* Right form area */}
        <div className="login-right">
          <div className="login-card">
            {/* Mobile logo */}
            <div className="mobile-logo-wrap">
              <img src={Logo} alt="SDO Logo" className="mobile-logo" />
              <span className="mobile-logo-text">SDO Cabuyao Portal</span>
            </div>

            <h1 className="login-card-title">Welcome back</h1>
            <p className="login-card-sub">Sign in to your account to continue</p>

            <form ref={formRef} onSubmit={handleLogin} onKeyDown={handleKeyDown}>
              {/* Username */}
              <div className="lg-field">
                <label className="lg-label" htmlFor="lg-username">Username / School ID</label>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon">
                    <LuUser size={16} />
                  </span>
                  <input
                    id="lg-username"
                    name="username"
                    className="lg-input"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lg-field">
                <label className="lg-label" htmlFor="lg-password">Password</label>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon">
                    <GoLock size={16} />
                  </span>
                  <input
                    id="lg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="lg-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="lg-eye-btn"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <IoEyeOutline size={16} /> : <FaRegEyeSlash size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="lg-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="lg-spinner" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Mobile quick links */}
            <div className="lg-links">
              <Link to="/request-deped-account" className="lg-link">
                <span className="lg-link-arrow">›</span>
                Request New DepEd Account
              </Link>
              <Link to="/reset-deped-account" className="lg-link">
                <span className="lg-link-arrow">›</span>
                Reset Existing DepEd Account
              </Link>
              <Link to="/checktransaction" className="lg-link">
                <span className="lg-link-arrow">›</span>
                Check Transaction Status
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showModal && (
        <div className="lg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lg-modal-header">
              <div className="lg-modal-title">
                <div className="lg-modal-title-icon">!</div>
                Login Failed
              </div>
              <button className="lg-modal-close" onClick={() => setShowModal(false)}>
                <FaTimes size={13} />
              </button>
            </div>
            <div className="lg-modal-body">
              <p>{errorMessage}</p>
              {remainingAttempts !== null && remainingAttempts > 0 && retryAfter === null && (
                <div className="lg-modal-attempts">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                </div>
              )}
              {retryAfter !== null && countdown > 0 && (
                <div className="lg-modal-countdown">
                  Try again in {countdown}s
                </div>
              )}
            </div>
            <button className="lg-modal-btn" onClick={() => setShowModal(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;