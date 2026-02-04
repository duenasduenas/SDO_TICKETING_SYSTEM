import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import Logo from "../../assets/SDO_Logo1.png";
import "../../styles/Login.css";
import InputGroup from "react-bootstrap/InputGroup";
import { LuUser } from "react-icons/lu";
import { GoLock } from "react-icons/go";
import { IoEyeOutline } from "react-icons/io5";
import { FaRegEyeSlash } from "react-icons/fa";
import { useAuth } from "../Context/AuthContext";
import Modal from "react-bootstrap/Modal";
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleLogin = async (e) => {
    e.preventDefault();
  
    const username = formRef.current.username.value;
    const password = formRef.current.password.value;
  
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/userlogin`, {
        username,
        password,
      });
  
      // The response from Axios will already have the data directly
      const data = response.data;
  
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Login Successful!",
          text: "Welcome Back!",
          timer: 1000,
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
  
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
  
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
  
        setShowModal(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Improved error handling to show more specific errors
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        const data = error.response.data;
        setErrorMessage(data.message || `Error: ${error.response.status}`);
        
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
  
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setErrorMessage("Network error. Please check your connection or server status.");
      } else {
        // Something happened in setting up the request
        setErrorMessage("An unexpected error occurred.");
      }
      
      setShowModal(true);
    }
  };



  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  };

  return (
    <div className="schoolLoginMain" id="school">
      <Card className="schoolLogin mx-auto">
        <Card.Header className="schoolHeader d-flex justify-content-center align-items-center">
          <div className="text-center">
            <h6 className="mb-4 text-light school-title">Login</h6>
            <img alt="Logo" src={Logo} className="schoolLogo mt-2" />
          </div>
        </Card.Header>

        <Card.Body className="schoolInput pt-5">
          <Form
            ref={formRef}
            onSubmit={handleLogin}
            onKeyDown={handleKeyDown} // Add the keydown event listener here
          >
            <InputGroup className="mb-5 schoolUsernameGroup">
              <InputGroup.Text id="basic-addon1" className="schoolIcon">
                <LuUser className="fs-4" />
              </InputGroup.Text>
              <Form.Control
                name="username"
                placeholder="Username or School ID"
                aria-label="Username"
                aria-describedby="basic-addon1"
                className="schoolUsername"
              />
              <InputGroup.Text id="basic-addon1" className="schoolIconhidden">
                @
              </InputGroup.Text>
            </InputGroup>

            <InputGroup className="mb-3 schoolPasswordGroup">
              <InputGroup.Text id="basic-addon1" className="schoolIcon">
                <GoLock className="fs-4" />
              </InputGroup.Text>
              <Form.Control
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                aria-label="Password"
                aria-describedby="basic-addon1"
                className="schoolPassword"
                required
              />

              <InputGroup.Text
                className="schoolIcon m-0"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <IoEyeOutline className="fs-5" />
                ) : (
                  <FaRegEyeSlash className="fs-5" />
                )}
              </InputGroup.Text>
            </InputGroup>
          </Form>
        </Card.Body>

        <Card.Footer className="schoolBtn">
          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="dark"
              className="schoolLoginBtn text-white"
              onClick={handleLogin}
              style={{ border: "none" }}
            >
              Login
            </Button>
          </div>
          <div>
            <Link
              to="/request-deped-account"
              className="mt-3 text-decoration-none"
            >
              Request New DepEd Account1
            </Link>
          </div>
          <div>
            <Link
              to="/reset-deped-account"
              className="mt-3 text-decoration-none"
            >
              Reset Existing DepEd Account
            </Link>
          </div>
          <div>
            <Link to="/checktransaction" className="mt-3 text-decoration-none">
              Check Transaction
            </Link>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal for login error */}
      {showModal && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="sm"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Login Error
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{errorMessage}</p>
            {remainingAttempts !== null &&
              remainingAttempts > 0 &&
              retryAfter === null && (
                <p>You have {remainingAttempts} attempt(s) left.</p>
              )}
            {retryAfter !== null && countdown > 0 && (
              <p>
                You can try again in <strong>{countdown}</strong> seconds.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Login;
