import { useEffect, useState } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import { FiLogOut, FiTool, FiCheckCircle, FiClock, FiUser, FiMessageSquare, FiCalendar } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

export default function TechnicianDashboard() {
  const [tasks, setTasks] = useState([]);
  const [currentTech, setCurrentTech] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [fixDetails, setFixDetails] = useState("");

  // Get current technician info
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No logged-in user; stop loading to avoid spinner lock
        setLoading(false);
        return;
      }
      try {
        const usersSnap = await get(ref(db, "users/"));
        const data = usersSnap.val();
        if (data) {
          const tech = Object.values(data).find((u) => u.email === user.email);
          if (tech) setCurrentTech(tech.name);
        }
      } catch (_err) {
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch tasks assigned to current technician
  useEffect(() => {
    if (!currentTech) return;

    const brkRef = ref(db, "breakdowns/");
    const unsubscribe = onValue(brkRef, (snap) => {
      const data = snap.val();
      if (data) {
        const filtered = Object.entries(data)
          .filter(([_, val]) => val.assignedTechnician?.name === currentTech)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => {
            // Sort by status: assigned first, then resolved
            if (a.status === "assigned" && b.status !== "assigned") return -1;
            if (a.status !== "assigned" && b.status === "assigned") return 1;
            // Then sort by creation date (newest first)
            return (b.timestamps?.created || 0) - (a.timestamps?.created || 0);
          });
        setTasks(filtered);
      } else {
        setTasks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentTech]);

  // Mark task as resolved
  const handleResolve = async (task) => {
    if (!fixDetails.trim()) return toast.error("Please enter fix details!");

    setLoading(true);
    try {
      const brkRef = ref(db, "breakdowns/" + task.id);
      const snapshot = await get(brkRef);
      const currentTimestamps = snapshot.val()?.timestamps || { created: Date.now() };

      await update(brkRef, {
        status: "resolved",
        fixDetails: fixDetails.trim(),
        timestamps: { ...currentTimestamps, updated: Date.now() },
      });

      toast.success("Task marked as resolved!");
      setActiveTask(null);
      setFixDetails("");
    } catch (err) {
      toast.error("Failed to update task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout technician
  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.info("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      toast.error("Logout failed!");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved": return <FiCheckCircle className="inline mr-1" />;
      case "assigned": return <FiTool className="inline mr-1" />;
      default: return <FiClock className="inline mr-1" />;
    }
  };

  const stats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === "assigned").length,
    resolved: tasks.filter(t => t.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
                <FiTool className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Technician Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {currentTech || "Technician"}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition duration-200"
            >
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FiTool className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.assigned}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <FiClock className="text-yellow-600 text-xl" />
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
                <FiCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Assigned Tasks</h2>
            <p className="text-gray-600">Manage and resolve breakdown reports</p>
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 text-center">
              <FiTool className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Assigned</h3>
              <p className="text-gray-600">You don't have any assigned breakdown reports at the moment.</p>
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Task Details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <FiCalendar className="mr-1" />
                          {new Date(task.timestamps?.created || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-start space-x-2 mb-3">
                        <FiMessageSquare className="text-gray-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-800 leading-relaxed">{task.message}</p>
                      </div>

                      {/* Reporter Info */}
                      {task.reporterName && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                          <FiUser className="text-gray-400" />
                          <span>
                            Reported by <span className="font-semibold">{task.reporterName}</span>
                            {task.reporterEmail && ` (${task.reporterEmail})`}
                          </span>
                        </div>
                      )}

                      {/* Fix Details for resolved tasks */}
                      {task.status === "resolved" && task.fixDetails && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-1 flex items-center">
                            <FiCheckCircle className="mr-2" />
                            Resolution Details
                          </h4>
                          <p className="text-green-700 text-sm">{task.fixDetails}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0">
                      {task.status === "assigned" ? (
                        <button
                          onClick={() => setActiveTask(activeTask?.id === task.id ? null : task)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition duration-200 font-medium"
                        >
                          {activeTask?.id === task.id ? "Cancel" : "Mark Resolved"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-xl font-medium">
                          <FiCheckCircle className="mr-2" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resolution Form */}
                  {activeTask?.id === task.id && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-blue-800 mb-3">Resolution Details</h4>
                      <textarea
                        value={fixDetails}
                        onChange={(e) => setFixDetails(e.target.value)}
                        placeholder="Describe how you fixed the issue, parts replaced, time taken, etc."
                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        rows="4"
                      />
                      <div className="flex justify-end space-x-3 mt-3">
                        <button
                          onClick={() => {
                            setActiveTask(null);
                            setFixDetails("");
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolve(task)}
                          disabled={loading || !fixDetails.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Updating..." : "Mark as Resolved"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}