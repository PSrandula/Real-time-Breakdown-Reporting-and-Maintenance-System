import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { ref, push, onValue, update, remove } from "firebase/database";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { FiEdit, FiTrash2, FiCheck, FiX, FiLogOut, FiPlus, FiUser, FiClock, FiAlertCircle } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [reports, setReports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setReports([]);
      return;
    }
    const reportsRef = ref(db, "breakdowns/");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .filter(([_, val]) => val.reporterUid === currentUser.uid)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.timestamps.created - a.timestamps.created);
        setReports(list);
      } else {
        setReports([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Please log in!");

    try {
      await push(ref(db, "breakdowns/"), {
        reporterUid: currentUser.uid,
        reporterName: currentUser.displayName || "Reporter",
        reporterEmail: currentUser.email,
        message,
        status: "pending",
        assignedTechnician: null,
        fixDetails: null,
        timestamps: {
          created: Date.now(),
          updated: Date.now(),
        },
      });
      setMessage("");
      setShowForm(false);
      toast.success("Report submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit report: " + err.message);
    }
  };

  const handleEdit = async (id, newMessage) => {
    try {
      const reportRef = ref(db, "breakdowns/" + id);
      await update(reportRef, {
        message: newMessage,
        timestamps: { updated: Date.now() },
      });
      toast.success("Report updated successfully!");
    } catch (err) {
      toast.error("Failed to update report: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const reportRef = ref(db, "breakdowns/" + id);
      await remove(reportRef);
      toast.success("Report deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete report: " + err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved": return "✅";
      case "assigned": return "👨‍💻";
      case "in-progress": return "🛠️";
      default: return "⏳";
    }
  };

  if (loadingUser) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
  
  if (!currentUser) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">Please log in to access the dashboard</p>
        <button 
          onClick={() => navigate("/login")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Reporter Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FiUser className="text-gray-400" />
                <span>{currentUser.displayName || currentUser.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition duration-200"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reports.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FiAlertCircle className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {reports.filter(r => r.status === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reports.filter(r => r.status === "in-progress" || r.status === "assigned").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-xl">🛠️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reports.filter(r => r.status === "resolved").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* New Report Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Reports</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition duration-200 shadow-sm"
          >
            <FiPlus size={18} />
            <span>New Report</span>
          </button>
        </div>

        {/* Report Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit New Breakdown Report</h3>
            <form onSubmit={handleSubmit}>
              <textarea
                className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Describe your issue in detail..."
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition duration-200"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border">
            <FiAlertCircle className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-6">Submit your first breakdown report to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition duration-200"
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report, onEdit, onDelete, getStatusColor, getStatusIcon }) {
  const [editing, setEditing] = useState(false);
  const [newMessage, setNewMessage] = useState(report.message);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition duration-200">
      <div className="p-6">
        {/* Header with status and actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
              {getStatusIcon(report.status)} {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
            {report.assignedTechnician && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                👨‍💻 {report.assignedTechnician.name || report.assignedTechnician}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    onEdit(report.id, newMessage);
                    setEditing(false);
                  }}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
                  title="Save"
                >
                  <FiCheck size={16} />
                </button>
                <button
                  onClick={() => {
                    setNewMessage(report.message);
                    setEditing(false);
                  }}
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-200"
                  title="Cancel"
                >
                  <FiX size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                  title="Edit"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report content */}
        <div className="mb-4">
          {editing ? (
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows="3"
            />
          ) : (
            <p className="text-gray-800 leading-relaxed">{report.message}</p>
          )}
        </div>

        {/* Fix details if available */}
        {report.fixDetails && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-1">Fix Details</h4>
            <p className="text-green-700 text-sm">{report.fixDetails}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <FiClock size={12} />
            <span>Created: {new Date(report.timestamps.created).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock size={12} />
            <span>Updated: {new Date(report.timestamps.updated).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 transform transition-all">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Report?</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this report? This action cannot be undone.</p>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(report.id);
                  setShowDeleteModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}