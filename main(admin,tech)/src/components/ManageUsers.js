import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, onValue, remove } from "firebase/database";
import { auth, db } from "../firebaseConfig";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiUserPlus, FiTrash2, FiArrowLeft, FiShield } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

export default function ManageUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("technician");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const navigate = useNavigate();

  // Password validation
  const validatePassword = (pwd) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,}$/;
    return regex.test(pwd);
  };

  // Add new user
  const handleAddUser = async () => {
    if (!name || !email || !password) {
      toast.error("All fields are required!");
      return;
    }

    if (!validatePassword(password)) {
      toast.error(
        "Password must be at least 6 characters, include a number and a special character!"
      );
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await set(ref(db, "users/" + cred.user.uid), {
        email,
        name,
        role,
        createdAt: Date.now(),
      });
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} added successfully!`);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  useEffect(() => {
    const usersRef = ref(db, "users/");
    const unsubscribe = onValue(usersRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
        }));
        setUsers(list);
      } else {
        setUsers([]);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Delete user
  const handleDelete = async (uid, name) => {
    setLoading(true);
    try {
      await remove(ref(db, "users/" + uid));
      toast.success(`User ${name} deleted successfully!`);
      setShowDeleteModal(null);
    } catch (err) {
      toast.error("Error deleting user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    return role === "manager" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl transition duration-200 shadow-sm border"
            >
              <FiArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage technicians and managers</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add User Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border">
              <div className="flex items-center space-x-2 mb-6">
                <FiUserPlus className="text-blue-600 text-xl" />
                <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                      placeholder="Enter full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-gray-400" />
                    <input
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min 6 chars with number and special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <FiShield className="absolute left-3 top-3 text-gray-400 z-10" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none bg-white"
                    >
                      <option value="technician">Technician</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddUser}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Adding User..." : "Add User"}
                </button>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Existing Users</h2>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {users.length} users
                </span>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-12">
                  <FiUser className="text-gray-400 text-4xl mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-600">Add your first user to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border hover:bg-white transition duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FiUser className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-sm text-gray-500 flex items-center space-x-2">
                            <span>{u.email}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                              {u.role}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowDeleteModal(u)}
                        disabled={loading}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 disabled:opacity-50"
                        title="Delete User"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <b>{showDeleteModal.name}</b>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal.id, showDeleteModal.name)}
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