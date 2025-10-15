import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ManageUsers from "./components/ManageUsers";
import TechnicianDashboard from "./components/TechnicianDashboard";

function App() {
  return (
    <BrowserRouter>
      {/* Global ToastContainer */}
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/tech-dashboard" element={<TechnicianDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
