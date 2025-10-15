import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    // Minimum 6 chars, at least 1 number, 1 special character
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,}$/;
    return regex.test(pwd);
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  if (!validatePassword(password)) {
    toast.error(
      "Password must be at least 6 characters long, include a number and a special character!"
    );
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const userRef = ref(db, "users/" + userCred.user.uid);
    const snap = await get(userRef);

    if (snap.exists()) {
      const user = snap.val();
      toast.success("Login successful!"); 
      setTimeout(() => {
        if (user.role === "manager") navigate("/dashboard");
        else if (user.role === "technician") navigate("/tech-dashboard");
        else toast.error("Unauthorized role.");
      }, 1500); 
    } else {
      toast.error("User not found in DB.");
    }
  } catch (err) {
    toast.error(err.message);
  }
};

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-96"
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Maintenance Manager/Technician Login
        </h2>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-4 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-6 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}
