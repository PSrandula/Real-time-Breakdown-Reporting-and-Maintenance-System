import { ref, update, onValue, remove } from "firebase/database";
import { db } from "../firebaseConfig";
import { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiCheck, FiX, FiUser, FiClock, FiMessageSquare } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BreakdownCard({ data }) {
  const [tech, setTech] = useState(data.assignedTechnician?.name || "");
  const [technicians, setTechnicians] = useState([]);
  const [editing, setEditing] = useState(false);
  const [newMessage, setNewMessage] = useState(data.message);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch technicians
  useEffect(() => {
    const usersRef = ref(db, "users/");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const techList = Object.entries(usersData)
          .filter(([_, val]) => val.role === "technician")
          .map(([id, val]) => ({
            id,
            name: val.name,
            email: val.email,
          }));
        setTechnicians(techList);
      } else setTechnicians([]);
    });
    
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  // Assign technician
  const handleAssign = async () => {
    if (!tech) return toast.error("Please select a technician!");
    
    setLoading(true);
    try {
      const breakdownRef = ref(db, "breakdowns/" + data.id);

      const snapshot = await new Promise((resolve) =>
        onValue(breakdownRef, (snap) => resolve(snap), { onlyOnce: true })
      );

      const currentTimestamps = snapshot.val()?.timestamps || { created: Date.now() };
      const selectedTech = technicians.find((t) => t.name === tech);
      if (!selectedTech) return;

      await update(breakdownRef, {
        status: "assigned",
        assignedTechnician: selectedTech,
        timestamps: { ...currentTimestamps, updated: Date.now() },
      });

      toast.success("Technician assigned successfully!");
    } catch (err) {
      toast.error("Failed to assign technician: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit report
  const handleEdit = async () => {
    if (!newMessage.trim()) return toast.error("Message cannot be empty!");
    
    setLoading(true);
    try {
      const breakdownRef = ref(db, "breakdowns/" + data.id);

      const snapshot = await new Promise((resolve) =>
        onValue(breakdownRef, (snap) => resolve(snap), { onlyOnce: true })
      );

      const currentTimestamps = snapshot.val()?.timestamps || { created: Date.now() };

      await update(breakdownRef, {
        message: newMessage,
        timestamps: { ...currentTimestamps, updated: Date.now() },
      });

      toast.success("Report updated successfully!");
      setEditing(false);
    } catch (err) {
      toast.error("Failed to update report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete report
  const handleDelete = async () => {
    setLoading(true);
    try {
      const breakdownRef = ref(db, "breakdowns/" + data.id);
      await remove(breakdownRef);
      toast.success("Report deleted successfully!");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error("Failed to delete report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition duration-200">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="p-6">
        {/* Header with status and actions */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(data.status)}`}>
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </span>
          
          <div className="flex space-x-2">
            {editing ? (
              <>
                <button
                  onClick={handleEdit}
                  disabled={loading}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50"
                  title="Save"
                >
                  <FiCheck size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setNewMessage(data.message);
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
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              rows="3"
              placeholder="Describe the breakdown..."
            />
          ) : (
            <div className="flex items-start space-x-2">
              <FiMessageSquare className="text-gray-400 mt-1 flex-shrink-0" />
              <p className="text-gray-800 leading-relaxed">{data.message}</p>
            </div>
          )}
        </div>

        {/* Reporter info */}
        {data.reporterName && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <FiUser className="text-gray-400" />
            <span>
              Reported by <span className="font-semibold">{data.reporterName}</span>
              {data.reporterEmail && ` (${data.reporterEmail})`}
            </span>
          </div>
        )}

        {/* Technician selection */}
        {(editing || data.status === "pending") && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Technician
            </label>
            <select
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            >
              <option value="">Select a technician</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              disabled={loading || !tech}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Assigning..." : "Assign Technician"}
            </button>
          </div>
        )}

        {/* Show assigned technician */}
        {data.assignedTechnician && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Assigned Technician</p>
            <p className="text-blue-700">
              {data.assignedTechnician.name} ({data.assignedTechnician.email})
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-1">
            <FiClock size={12} />
            <span>Created: {new Date(data.timestamps?.created || Date.now()).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock size={12} />
            <span>Updated: {new Date(data.timestamps?.updated || data.timestamps?.created || Date.now()).toLocaleString()}</span>
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
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this breakdown report? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition duration-200 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}