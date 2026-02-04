import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Context
import { AuthProvider } from "./components/Context/AuthContext";
import ProtectedRoute from "./components/Context/ProtectedRoutes";

// School
import SchoolDashboard from "./components/School/SchoolDashboard";
import Ticket from "./components/School/Ticket";
import StaffChangePassword from "./components/School/StaffChangePassword";
import Completed from "./components/School/Status/Completed";
import Pending from "./components/School/Status/Pending";
import InProgress from "./components/School/Status/InProgress";
import OnHold from "./components/School/Status/OnHold";
import Rejected from "./components/School/Status/Rejected";
import ReceivedBatches from "./components/School/Status/ReceivedBatches";
import PendingBatches from "./components/School/Status/PendingBatches";
import CancelledBatches from "./components/School/Status/CancelledBatches";

// Admin
import AdminDashboard from "./components/Admin/AdminDashboard";
import Batches from "./components/Admin/Batches";
import BatchCreate from "./components/Admin/BatchCreate";
import Issues from "./components/Admin/Issues";
import AdminChangePassword from "./components/Admin/AdminChangePassword";
import AddSchool from "./components/Admin/AddSchool";

// Public
import Forbidden from "./components/Public/Forbidden";
import NotFound from "./components/Public/NotFound";
import Login from "./components/Public/Login";
import RequestDepedAccount from "./components/Public/RequestDepedAccount";
import ResetDepedAccount from "./components/Public/ResetDepedAccount";
import CheckTransaction from "./components/Public/CheckTransaction";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/schooldashboard"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <SchoolDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ticket"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <Ticket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/completedticket"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <Completed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pendingticket"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <Pending />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inprogressticket"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <InProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onholdticket"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <OnHold />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rejectedticket"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <Rejected />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receivedbatches"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <ReceivedBatches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pendingbatches"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <PendingBatches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cancelledbatches"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <CancelledBatches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staffchangepassword"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <StaffChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admindashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issues"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Issues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addschool"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AddSchool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batches"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Batches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batchcreate"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <BatchCreate />
              </ProtectedRoute>
            }
          />
           <Route
            path="/adminchangepassword"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminChangePassword />
              </ProtectedRoute>
            }
          />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route
            path="/request-deped-account"
            element={<RequestDepedAccount />}
          />
          <Route
            path="/reset-deped-account"
            element={<ResetDepedAccount />}
          />
          <Route
            path="/checktransaction"
            element={<CheckTransaction />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
