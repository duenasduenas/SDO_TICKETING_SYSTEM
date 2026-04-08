import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../Context/AuthContext";
import Badge from "react-bootstrap/Badge";
import { Offcanvas } from "react-bootstrap";
import { useWindowSize } from "react-use";
import Logo from "../../assets/SDO_Logo1.png";
import { 
  MdOutlineSpaceDashboard, 
  MdKeyboardArrowDown 
} from "react-icons/md";
import { LuTickets } from "react-icons/lu";
import { FaRegListAlt } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa";
import Swal from "sweetalert2";
import { TbTruckDelivery } from "react-icons/tb";
import { TbPencilCog } from "react-icons/tb";


const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [school, setSchool] = useState(null);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const { logout } = useAuth();
  const { width } = useWindowSize();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showTicketDropdown, setShowTicketDropdown] = useState(false);
  const batchDropdownRef = useRef(null);
  const ticketDropdownRef = useRef(null);
  const offcanvasContentRef = useRef(null);
  const sidebarRef = useRef(null);

  // Token validation and user data setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/forbidden");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setSchool(decoded.school);
      setUsername(decoded.username);
      setRole(decoded.role);
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/forbidden");
    }
  }, [navigate]);

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (width < 768 && showSidebar && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target)) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSidebar, width]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (width >= 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Check if any sub-path in a dropdown is active
  const isDropdownActive = (paths) => {
    return paths.some(path => location.pathname === path);
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes"
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/");
      }
    });
  };

  const toggleBatchDropdown = () => {
    setShowBatchDropdown(!showBatchDropdown);
    setShowTicketDropdown(false); // Close other dropdown
  };

  const toggleTicketDropdown = () => {
    setShowTicketDropdown(!showTicketDropdown);
    setShowBatchDropdown(false); // Close other dropdown
  };

  // Set batch dropdown to open if any batch page is active
  useEffect(() => {
    if (isDropdownActive(['/pendingbatches', '/receivedbatches'])) {
      setShowBatchDropdown(true);
    }
  }, [location.pathname]);

  // Set ticket dropdown to open if any ticket page is active
  useEffect(() => {
    if (isDropdownActive(['/pendingticket', '/completedticket', '/rejectedticket', '/inprogressticket', '/onholdticket'])) {
      setShowTicketDropdown(true);
    }
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className="d-flex flex-column h-100" ref={sidebarRef}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="d-flex">
          <img
            alt="Logo"
            src={Logo}
            className="schoolLogo"
            style={{width: '40px'}}
          />
          <h5 className="mt-2 ms-2">SDO Cabuyao</h5>
        </div>
        <div className="">
          <p className="text-secondary text-center mt-4 fs-6">
            Deped Ticketing System
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-grow-1">
        <div className="nav flex-column">
          <a 
            href="/schooldashboard" 
            className={`nav-link text-dark d-flex align-items-center py-3 px-2 hover-effect ${isActive('/schooldashboard') ? 'active-nav-item' : ''}`}
          >
            <MdOutlineSpaceDashboard className="me-3 fs-5" />
            <span style={{fontSize: '15px'}}>Dashboard</span> 
          </a>
          <a 
            href="/ticket" 
            className={`nav-link text-dark d-flex align-items-center py-3 px-2 hover-effect ${isActive('/ticket') ? 'active-nav-item' : ''}`}
          >
            <LuTickets className="me-3 fs-5" />            
            <span style={{fontSize: '15px'}}>Ticket Request</span>
          </a>
          
          {/* Batch Management Dropdown */}
          <div className="nav-item">
            <button
              className={`nav-link text-dark d-flex align-items-center justify-content-between w-100 py-1 px-2 border-0 bg-transparent hover-effect ${isDropdownActive(['/pendingbatches', '/receivedbatches']) ? 'active-nav-item' : ''}`}
              onClick={toggleBatchDropdown}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center">
                <TbTruckDelivery className="me-3 fs-5" />
                <span style={{fontSize: '15px'}}>DCP Package</span>
              </div>
              <MdKeyboardArrowDown 
                className={`fs-5 transition-transform ${showBatchDropdown ? 'rotate-180' : ''}`}
                style={{ transition: 'transform 0.3s ease' }}
              />
            </button>
            <div 
              ref={batchDropdownRef}
              className="dropdown-menu-custom"
              style={{
                maxHeight: showBatchDropdown ? '1000px' : '0',
                opacity: showBatchDropdown ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
                overflow: 'hidden'
              }}
            >
              <a 
                href="/pendingbatches" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/pendingbatches') ? 'active-nav-item' : ''}`}
              >
                Pending 
              </a>
              <a 
                href="/receivedbatches" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/receivedbatches') ? 'active-nav-item' : ''}`}
              >
                Received 
              </a>
              <a 
                href="/cancelledbatches" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/cancelledbatches') ? 'active-nav-item' : ''}`}
              >
                Cancelled 
              </a>
            </div>
          </div>

          {/* Ticket Management Dropdown */}
          <div className="nav-item">
            <button
              className={`nav-link text-dark d-flex align-items-center justify-content-between w-100 py-3 px-2 border-0 bg-transparent hover-effect ${isDropdownActive(['/pendingticket', '/completedticket', '/rejectedticket', '/inprogressticket', '/onholdticket']) ? 'active-nav-item' : ''}`}
              onClick={toggleTicketDropdown}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center">
                <FaRegListAlt className="me-3 fs-5" />
                <span style={{fontSize: '15px'}}>Ticket Management</span>
              </div>
              <MdKeyboardArrowDown 
                className={`fs-5 transition-transform ${showTicketDropdown ? 'rotate-180' : ''}`}
                style={{ transition: 'transform 0.3s ease' }}
              />
            </button>
            <div 
              ref={ticketDropdownRef}
              className="dropdown-menu-custom"
              style={{
                maxHeight: showTicketDropdown ? '1000px' : '0',
                opacity: showTicketDropdown ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
                overflow: 'hidden'
              }}
            >
              <a 
                href="/pendingticket" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/pendingticket') ? 'active-nav-item' : ''}`}
              >
                Pending 
              </a>
              <a 
                href="/completedticket" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/completedticket') ? 'active-nav-item' : ''}`}
              >
                Completed 
              </a>
              <a 
                href="/rejectedticket" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/rejectedticket') ? 'active-nav-item' : ''}`}
              >
                Rejected
              </a>
              <a 
                href="/inprogressticket" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/inprogressticket') ? 'active-nav-item' : ''}`}
              >
                In progress 
              </a>
              <a 
                href="/onholdticket" 
                className={`nav-link text-dark py-2 px-4 dropdown-item hover-effect ${isActive('/onholdticket') ? 'active-nav-item' : ''}`}
              >
                On Hold
              </a>
            </div>
          </div>
          <a 
            href="/staffchangepassword" 
            className={`nav-link text-dark d-flex align-items-center py-3 px-2 hover-effect ${isActive('/staffchangepassword') ? 'active-nav-item' : ''}`}
          >
            <TbPencilCog className="me-3 fs-5" />
            <span style={{fontSize: '15px'}}>Reset Pssword</span> 
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-top pt-3">
        <div className="d-flex align-items-center mb-3">
          <div className="me-2">
            <small className="text-muted">Logged in as:</small>
            <div className="fw-bold">{school}</div>
          </div>
        </div>
        <button
          className="btn btn-dark w-100 logout-btn"
          onClick={handleLogout}
          style={{ backgroundColor: "#294a70", border: 'none'}}
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
          .hover-effect {
            transition: all 0.2s ease-in-out;
          }
          
          .hover-effect:hover {
            background-color: rgba(41, 74, 112, 0.1);
            border-radius: 4px;
          }

          .active-nav-item {
            background-color: rgba(41, 74, 112, 0.1);
            border-radius: 4px;
            font-weight: bold;
          }

          /* Add this to match AdminHeader hover effect */
          .active-nav-item:hover {
            background-color: rgba(41, 74, 112, 0.15);
          }

          .rotate-180 {
            transform: rotate(180deg);
          }

          .transition-transform {
            transition: transform 0.8s ease;
          }

          .dropdown-menu-custom {
            margin-left: 2rem;
          }

          .logout-btn:hover {
            background-color: #1c3655 !important;
          }

          @media (min-width: 768px) {
            .main-content {
              margin-left: 250px;
            }
          }
        `}
      </style>

      {/* Desktop Sidebar */}
      {width >= 768 && (
        <div
          className="sidebar position-fixed bg-white"
          style={{
            top: 0,
            left: 0,
            width: "250px",
            height: "100vh",
            padding: "15px",
            color: "#294a70",
            zIndex: 1000,
            boxShadow: "4px 0 8px rgba(0, 0, 0, 0.1)",
            overflowY: "auto"

          }}
        >
          <SidebarContent />
        </div>
      )}

      {/* Navbar */}
      <nav
        className="navbar navbar-dark fixed-top"
        style={{
          backgroundColor: "#294a70",
          marginLeft: width >= 768 ? "250px" : "0",
          zIndex: 500,
          transition: "margin-left 0.3s ease-in-out"
        }}
      >
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            {width < 768 && (
              <button
                className="navbar-toggler me-2"
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            )}
            <a className="navbar-brand" href="#">
              <b className="d-none d-lg-inline">{school}</b>
              <span className="fs-6 ms-lg-4 ms-0 d-lg-inline">
                <i>School ID: {username}</i>
                <Badge bg="light" className="ms-3" style={{ color: "#294a70" }}>
                  {role}
                </Badge>
              </span>
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <Offcanvas
        show={showSidebar && width < 768}
        onHide={() => setShowSidebar(false)}
        placement="start"
        backdrop={true}
        style={{ 
          width: "250px", 
          boxShadow: "4px 0 8px rgba(0, 0, 0, 0.1)",
          border: "none"
        }}
      >
        <Offcanvas.Body className="">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Navbar;