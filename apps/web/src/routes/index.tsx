import { createBrowserRouter, Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import CoursesPage from "../pages/CoursesPage";
import CourseDetailPage from "../pages/CourseDetailPage";
import CreateCoursePage from "../pages/CreateCoursePage";
import MyBookingsPage from "../pages/MyBookingsPage";
import BugsPage from "../pages/BugsPage";

const protectedChildren: RouteObject[] = [
  { path: "/courses", element: <CoursesPage /> },
  { path: "/courses/new", element: <CreateCoursePage /> },
  { path: "/courses/:id", element: <CourseDetailPage /> },
  { path: "/bookings", element: <MyBookingsPage /> },
];

if (import.meta.env.VITE_BUGS === "on") {
  protectedChildren.push({ path: "/bugs", element: <BugsPage /> });
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: protectedChildren,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/courses" replace />,
  },
]);

export default router;
