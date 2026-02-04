import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import "../../styles/AdminDashboard.css";
import { Alert, Form, Tab } from "react-bootstrap";
import SupportTickets from "./SupportTickets";
import NewAccountRequests from "./NewAccountRequests";
import ResetAccountRequests from "./ResetAccountRequests";
import BatchCreate from "./BatchCreate";
import AdminHeader from "./AdminHeader";
import ViewBatches from "./ViewBatches";
import Issues from "./Issues";
import AdminChangePassword from "./AdminChangePassword";
import AddSchool from "./AddSchool";
import { useWindowSize } from "react-use";
import { API_BASE_URL } from "../../config";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [newAccountRequests, setNewAccountRequests] = useState([]);
  const [resetAccountRequests, setResetAccountRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");
  const [activeMainTab, setActiveMainTab] = useState("ticketing");
  const { width } = useWindowSize();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetchTickets();
    if (!token) {
      navigate("/forbidden");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setLastName(decoded.lastname);
      setFirstName(decoded.firstname);
      setUsername(decoded.username);
      setRole(decoded.role || "Admin");
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/forbidden");
    }
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/ticket/tickets`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: { timestamp: Date.now() }
      });
      setTickets(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to load tickets. Please try again later.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewAccountRequests = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/depedacc/deped-account-requests`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          params: { timestamp: Date.now() }
        }
      );
      setNewAccountRequests(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (error) {
      console.error("Error fetching new account requests:", error);
      setError("Failed to load new account requests.");
      setNewAccountRequests([]);
    }
  };

  const fetchResetAccountRequests = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/depedacc/deped-account-reset-requests`
      );
      setResetAccountRequests(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (error) {
      console.error("Error fetching reset account requests:", error);
      setError("Failed to load reset account requests.");
      setResetAccountRequests([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTickets(),
      fetchNewAccountRequests(),
      fetchResetAccountRequests(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (['tickets', 'newAccounts', 'resetAccounts'].includes(activeTab)) {
      setActiveMainTab('ticketing');
    } else if (['batchCreate', 'viewBatches'].includes(activeTab)) {
      setActiveMainTab('dcp');
    } else {
      setActiveMainTab('');
    }
  }, [activeTab]);

  const statusOptions = ["Completed", "Pending", "On Hold", "In Progress", "Rejected"];
  const accountStatusOptions = ["Completed", "Pending", "In Progress", "Rejected"];
  const viewBatchOptions = ["Delivered", "Pending"];
  const issuesCategoryOptions = ["Hardware", "Software"];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterStatus("all");
    setSearchTerm("");
    setFilterMonth("all");
    setFilterYear("");
  };

  const shouldShowSearchFilter =
    activeTab !== "batchCreate" && 
    activeTab !== "adminchangepass" &&
    activeTab !== "addSchool";

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "issues": return "Enter issue name";
      case "tickets": return "Enter No. or Requestor or Category";
      case "newAccounts": return "Enter No. or Type or Name or School";
      case "resetAccounts": return "Enter No. or Type or Name or School";
      case "viewBatches": return "Enter No. or School Name or School Code";
      default: return "Search";
    }
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case "tickets": return statusOptions;
      case "newAccounts":
      case "resetAccounts": return accountStatusOptions;
      case "viewBatches": return viewBatchOptions;
      case "issues": return issuesCategoryOptions;
      default: return [];
    }
  };

  const getBreadcrumb = () => {
    if (activeTab === 'tickets' || activeTab === 'newAccounts' || activeTab === 'resetAccounts') {
      return (
        <div className="mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">Ticketing</li>
              <li className="breadcrumb-item active">
                {activeTab === 'tickets' ? 'Tickets' : 
                 activeTab === 'newAccounts' ? 'New Account Requests' : 
                 'Reset Account Requests'}
              </li>
            </ol>
          </nav>
        </div>
      );
    } else if (activeTab === 'batchCreate' || activeTab === 'viewBatches') {
      return (
        <div className="mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">DCP</li>
              <li className="breadcrumb-item active">
                {activeTab === 'batchCreate' ? 'Create Batch' : 'View Batch'}
              </li>
            </ol>
          </nav>
        </div>
      );
    } else if (activeTab === 'addSchool') {
      return (
        <div className="mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">School Management</li>
              <li className="breadcrumb-item active">Add New User</li>
            </ol>
          </nav>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <style>
        {`
          @media (min-width: 768px) {
            .main-content {
              margin-left: 250px;
              transition: margin-left 0.3s ease-in-out;
            }
          }
          .search-filter-container {
            background-color: white;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          .breadcrumb {
            background-color: #f8f9fa;
            padding: 0.75rem 1rem;
            border-radius: 0.25rem;
          }
          .breadcrumb-item.active {
            color: #344767;
            font-weight: 500;
          }
        `}
      </style>

      <AdminHeader
        firstName={firstName}
        lastName={lastName}
        username={username}
        role={role}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
      />

      <div className="main-content" style={{
        marginLeft: width >= 768 ? "250px" : "0",
        marginTop: "60px",
        padding: "20px",
        transition: "margin-left 0.3s ease-in-out"
      }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {getBreadcrumb()}

        {shouldShowSearchFilter && (
          <div className="row search-filter-container flex-wrap">
            <div className="col-6 d-flex justify-content-start">
              <Form.Control
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-100"
                style={{ maxWidth: "50%" }}
              />
            </div>
            <div className="col-6 d-flex justify-content-end">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-100"
                style={{ maxWidth: "25%" }}
              >
                <option value="all">
                  All {activeTab === "issues" ? "Categories" : "Status"}
                </option>
                {getFilterOptions().map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
            </div>
            {(activeTab === "newAccounts" || activeTab === "tickets" || activeTab === "resetAccounts") && (
              <div className="col-12 d-flex align-items-center mt-2 flex-wrap" style={{ gap: "16px" }}>
                <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }}>
                  <span style={{ minWidth: "70px" }}>Month:</span>
                  <Form.Select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ minWidth: "140px" }}
                  >
                    <option value="all">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </Form.Select>
                </div>
                <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }}>
                  <span style={{ minWidth: "70px" }}>Year:</span>
                  <Form.Select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{ minWidth: "120px" }}
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => new Date().getFullYear() - i)
                      .map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                  </Form.Select>
                </div>
              </div>
            )}
          </div>
        )}

        <Tab.Container activeKey={activeTab}>
          <Tab.Content>
            <Tab.Pane eventKey="tickets">
              <SupportTickets
                tickets={tickets}
                loading={loading}
                filterStatus={filterStatus}
                searchTerm={searchTerm}
                filterMonth={filterMonth}
                filterYear={filterYear}
                fetchTickets={fetchTickets}
              />
            </Tab.Pane>

            <Tab.Pane eventKey="newAccounts">
              <NewAccountRequests
                newAccountRequests={newAccountRequests}
                loading={loading}
                filterStatus={filterStatus}
                searchTerm={searchTerm}
                filterMonth={filterMonth}
                filterYear={filterYear}
                fetchNewAccountRequests={fetchNewAccountRequests}
              />
            </Tab.Pane>

            <Tab.Pane eventKey="resetAccounts">
              <ResetAccountRequests
                resetAccountRequests={resetAccountRequests}
                loading={loading}
                filterStatus={filterStatus}
                searchTerm={searchTerm}
                filterMonth={filterMonth}
                filterYear={filterYear}
                fetchResetAccountRequests={fetchResetAccountRequests}
              />
            </Tab.Pane>

            <Tab.Pane eventKey="batchCreate">
              <BatchCreate />
            </Tab.Pane>

            <Tab.Pane eventKey="viewBatches">
              <ViewBatches
                filterStatus={filterStatus}
                searchTerm={searchTerm}
              />
            </Tab.Pane>

            <Tab.Pane eventKey="issues">
              <Issues filterStatus={filterStatus} searchTerm={searchTerm} />
            </Tab.Pane>

            <Tab.Pane eventKey="adminchangepass">
              <AdminChangePassword />
            </Tab.Pane>

            <Tab.Pane eventKey="addSchool">
              <AddSchool />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    </>
  );
};

export default AdminDashboard;