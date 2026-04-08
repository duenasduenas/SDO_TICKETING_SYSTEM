import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import { Alert, Tab } from "react-bootstrap";
import SupportTickets from "./SupportTickets";
import NewAccountRequests from "./NewAccountRequests";
import ResetAccountRequests from "./ResetAccountRequests";
import CreateDesignation from "./CreateDesignation";
import BatchCreate from "./BatchCreate";
import AdminHeader from "./AdminHeader";
import ViewBatches from "./ViewBatches";
import Issues from "./Issues";
import AdminChangePassword from "./AdminChangePassword";
import AddSchool from "./AddSchool";
import { useWindowSize } from "react-use";
import { API_BASE_URL } from "../../config";
import { FaTimes } from "react-icons/fa";

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
      const token = localStorage.getItem("token");
      if (!token) { setError("No authentication token found."); setTickets([]); return; }
      const response = await axios.get(`${API_BASE_URL}/api/ticket/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timestamp: Date.now() },
      });
      setTickets(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (error) {
      setError("Failed to load tickets. Please try again later.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewAccountRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setNewAccountRequests([]); return; }
      const response = await axios.get(`${API_BASE_URL}/api/depedacc/deped-account-requests?page=1&limit=50`, {
        headers: { "Cache-Control": "no-cache", Authorization: `Bearer ${token}` },
      });
      setNewAccountRequests(Array.isArray(response.data.data) ? response.data.data : []);
      setError("");
    } catch (error) {
      console.error('New Account Requests error:', error);
      setError("Failed to load new account requests.");
      setNewAccountRequests([]);
    }
  };

  const fetchResetAccountRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setResetAccountRequests([]); return; }
      const response = await axios.get(`${API_BASE_URL}/api/depedacc/deped-account-reset-requests?page=1&limit=50`, {
        headers: { "Cache-Control": "no-cache", Authorization: `Bearer ${token}` },
      });
      setResetAccountRequests(Array.isArray(response.data.data) ? response.data.data : []);
      setError("");
    } catch (error) {
      console.error('Reset Account Requests error:', error);
      setError("Failed to load reset account requests.");
      setResetAccountRequests([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchTickets(), fetchNewAccountRequests(), fetchResetAccountRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (["tickets", "newAccounts", "resetAccounts"].includes(activeTab)) {
      setActiveMainTab("ticketing");
    } else if (["batchCreate", "viewBatches"].includes(activeTab)) {
      setActiveMainTab("dcp");
    } else {
      setActiveMainTab("");
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
    activeTab !== "addSchool" &&
    activeTab !== "createDesignation";

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "issues":        return "Enter issue name";
      case "tickets":       return "Enter No. or Requestor or Category";
      case "newAccounts":   return "Enter No. or Type or Name or School";
      case "resetAccounts": return "Enter No. or Type or Name or School";
      case "viewBatches":   return "Enter No. or School Name or School Code";
      default:              return "Search";
    }
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case "tickets":       return statusOptions;
      case "newAccounts":
      case "resetAccounts": return accountStatusOptions;
      case "viewBatches":   return viewBatchOptions;
      case "issues":        return issuesCategoryOptions;
      default:              return [];
    }
  };

  const showMonthYearFilter =
    activeTab === "newAccounts" ||
    activeTab === "tickets" ||
    activeTab === "resetAccounts";

  const getBreadcrumb = () => {
    const crumbs = {
      tickets:          ["Ticketing", "Tickets"],
      newAccounts:      ["Ticketing", "New Account Requests"],
      resetAccounts:    ["Ticketing", "Reset Account Requests"],
      batchCreate:      ["DCP", "Create Batch"],
      viewBatches:      ["DCP", "View Batch"],
      addSchool:        ["School Management", "Add New User"],
      createDesignation:["Admin", "Manage Designations"],
    };
    const crumb = crumbs[activeTab];
    if (!crumb) return null;
    return (
      <nav aria-label="breadcrumb" style={{ marginBottom: "16px" }}>
        <ol style={{
          display: "flex", alignItems: "center", gap: "6px",
          listStyle: "none", margin: 0, padding: 0,
          fontSize: "0.83rem", color: "#7a8fa6",
        }}>
          <li style={{ color: "#7a8fa6" }}>{crumb[0]}</li>
          <li style={{ color: "#b0bec5" }}>/</li>
          <li style={{ color: "#1a2e4a", fontWeight: 600 }}>{crumb[1]}</li>
        </ol>
      </nav>
    );
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .ad-main {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: #f7f9fc;
          min-height: 100vh;
        }

        @media (min-width: 768px) {
          .ad-content { margin-left: 250px; }
        }

        .ad-content {
          margin-top: 60px;
          padding: 24px 24px 40px;
          transition: margin-left 0.3s ease-in-out;
        }

        /* Search / Filter bar */
        .ad-filter-bar {
          background: #fff;
          border: 1px solid #e4ecf4;
          border-radius: 8px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .ad-search-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid #d0dbe8;
          border-radius: 7px;
          overflow: hidden;
          background: #fff;
          flex: 1;
          min-width: 200px;
          max-width: 420px;
        }

        .ad-search-input {
          border: none;
          outline: none;
          flex: 1;
          padding: 7px 12px;
          font-size: 0.83rem;
          color: #2c3e50;
          background: #fff;
        }

        .ad-search-clear {
          background: none;
          border: none;
          padding: 0 10px;
          color: #aab8c8;
          cursor: pointer;
          font-size: 12px;
          transition: color .15s;
          line-height: 1;
        }

        .ad-search-clear:hover { color: #dc3545; }

        .ad-select {
          border: 1.5px solid #d0dbe8;
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 0.83rem;
          color: #2c3e50;
          background: #fff;
          outline: none;
          cursor: pointer;
          transition: border-color .15s;
          appearance: auto;
        }

        .ad-select:focus { border-color: #294a70; }

        .ad-filter-label {
          font-size: 0.8rem;
          color: #7a8fa6;
          font-weight: 500;
          white-space: nowrap;
        }

        .ad-filter-group {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        /* Error alert */
        .ad-alert {
          background: #fdecea;
          border: 1px solid #f5c6c3;
          border-radius: 7px;
          color: #b71c1c;
          padding: 10px 16px;
          font-size: 0.85rem;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>

      <div className="ad-main">
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

        <div
          className="ad-content"
          style={{ marginLeft: width >= 768 ? "250px" : "0" }}
        >
          {/* Error */}
          {error && (
            <div className="ad-alert">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#b71c1c", padding: 0 }}
              >
                <FaTimes size={13} />
              </button>
            </div>
          )}

          {/* Breadcrumb */}
          {getBreadcrumb()}

          {/* Search / Filter Bar */}
          {shouldShowSearchFilter && (
            <div className="ad-filter-bar">
              {/* Search input */}
              <div className="ad-search-wrap">
                <input
                  className="ad-search-input"
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="ad-search-clear" onClick={() => setSearchTerm("")} title="Clear">
                    <FaTimes size={11} />
                  </button>
                )}
              </div>

              {/* Status / Category filter */}
              <select
                className="ad-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ minWidth: 140 }}
              >
                <option value="all">
                  All {activeTab === "issues" ? "Categories" : "Status"}
                </option>
                {getFilterOptions().map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {/* Month / Year filters */}
              {showMonthYearFilter && (
                <>
                  <div className="ad-filter-group">
                    <span className="ad-filter-label">Month:</span>
                    <select
                      className="ad-select"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      style={{ minWidth: 130 }}
                    >
                      <option value="all">All Months</option>
                      {months.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ad-filter-group">
                    <span className="ad-filter-label">Year:</span>
                    <select
                      className="ad-select"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      style={{ minWidth: 110 }}
                    >
                      <option value="">All Years</option>
                      {Array.from(
                        { length: new Date().getFullYear() - 2000 + 1 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Content */}
          <Tab.Container activeKey={activeTab}>
            <Tab.Content>
              <Tab.Pane eventKey="createDesignation">
                <CreateDesignation />
              </Tab.Pane>

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
                <ViewBatches filterStatus={filterStatus} searchTerm={searchTerm} />
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
      </div>
    </>
  );
};

export default AdminDashboard;