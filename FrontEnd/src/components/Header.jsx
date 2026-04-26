import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between">
      <h1>Task Manager</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}