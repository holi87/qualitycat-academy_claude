import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/courses" className="text-lg font-bold text-gray-900">
            QualityCat Academy
          </Link>
          {user && (
            <div className="flex gap-4">
              <Link
                to="/courses"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Courses
              </Link>
              <Link
                to="/bookings"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                My Bookings
              </Link>
              {(user.role === "ADMIN" || user.role === "MENTOR") && (
                <Link
                  to="/courses/new"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  New Course
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-500">
                {user.name}{" "}
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                  {user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
