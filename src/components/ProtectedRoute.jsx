import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <Navbar />
      <main className="main-content" style={{ flex: 1, minHeight: "100vh", background: "var(--bg)" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;
