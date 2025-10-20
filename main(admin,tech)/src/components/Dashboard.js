import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db, auth } from "../firebaseConfig";
import BreakdownCard from "../components/BreakdownCard";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import { FiUsers, FiLogOut, FiAlertTriangle, FiSettings, FiBarChart } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

export default function Dashboard() {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const breakdownRef = ref(db, "breakdowns/");
    const unsubscribe = onValue(breakdownRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
        }));
        setBreakdowns(list);
      } else {
        setBreakdowns([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      toast.error("Error logging out: " + err.message);
    }
  };

  const filteredBreakdowns = breakdowns.filter(brk => {
    if (filter === "all") return true;
    return brk.status === filter;
  });

  const getStats = () => {
    const total = breakdowns.length;
    const pending = breakdowns.filter(brk => brk.status === "pending").length;
    const assigned = breakdowns.filter(brk => brk.status === "assigned").length;
    const resolved = breakdowns.filter(brk => brk.status === "resolved").length;
    
    return { total, pending, assigned, resolved };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <FiSettings className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-sm text-gray-500">Monitor and manage breakdown reports</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/users")}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition duration-200"
              >
                <FiUsers size={16} />
                <span>Manage Users</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition duration-200"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FiBarChart className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.assigned}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <FiUsers className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <FiSettings className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Title */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Breakdown Reports</h2>
            <p className="text-gray-600">Manage and monitor all equipment breakdowns</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "assigned", "in-progress", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition duration-200 ${
                  filter === status
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        {filteredBreakdowns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border">
            <FiAlertTriangle className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {breakdowns.length === 0 ? "No Reports Yet" : "No Matching Reports"}
            </h3>
            <p className="text-gray-600">
              {breakdowns.length === 0 
                ? "Breakdown reports will appear here once submitted by reporters." 
                : `No reports found with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBreakdowns.map((brk) => (
              <BreakdownCard key={brk.id} data={brk} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}